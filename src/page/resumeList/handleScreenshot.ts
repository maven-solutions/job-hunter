import { uploadOrgSessionScreenshot } from "../../store/features/Organization/OrgApi";
import { uploadIndividualSessionScreenshot } from "../../store/features/ResumeList/ResumeListApi";
import { uploadApplicantSessionScreenshot } from "../../store/features/applicant/ApplicantApi";
import { AppDispatch } from "../../store/store";
import { EXTENSION_ACTION, EXTENSION_ROOT_ID } from "../../utils/constant";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

let screenshotInProgress = false;
let lastCaptureStartedAt = 0;

const CAPTURE_MIN_INTERVAL_MS = 550;
const SCROLL_TOLERANCE_PX = 2;

const captureVisibleTab = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: EXTENSION_ACTION.CAPTURE_VISIBLE_TAB },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response?.success || !response?.dataUrl) {
          reject(new Error(response?.error || "Capture failed"));
          return;
        }

        resolve(response.dataUrl);
      },
    );
  });
};

/**
 * Chrome limits captureVisibleTab calls. Keep at least ~550 ms between calls
 * so normal captures and retries do not hit the browser rate limit.
 */
const captureVisibleTabRateLimited = async (): Promise<string> => {
  const elapsed = Date.now() - lastCaptureStartedAt;

  if (elapsed < CAPTURE_MIN_INTERVAL_MS) {
    await wait(CAPTURE_MIN_INTERVAL_MS - elapsed);
  }

  lastCaptureStartedAt = Date.now();
  return captureVisibleTab();
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
};

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Failed to create image")),
      "image/png",
    );
  });
};

const waitForPaint = async () => {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  await wait(400);
};

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

type ScreenshotInteractionLock = {
  setExpectedPosition: (x: number, y: number) => void;
  getUnexpectedMovementVersion: () => number;
  release: () => void;
};

/**
 * Prevent the user from moving/interacting with the page while the screenshot
 * is being stitched.
 *
 * Important: programmatic scrolling must still work, because we need to move
 * the page between captures. setExpectedPosition() tells the lock which scroll
 * movement is intentional.
 */
const lockPageInteractionForScreenshot = (
  scrollElement: Element,
): ScreenshotInteractionLock => {
  let expectedX = Math.round(window.scrollX || 0);
  let expectedY = Math.round(window.scrollY || scrollElement.scrollTop || 0);
  let unexpectedMovementVersion = 0;
  let correctingScroll = false;

  const listenerOptions: AddEventListenerOptions = {
    capture: true,
    passive: false,
  };

  const preventInteraction = (event: Event) => {
    if (event.cancelable) {
      event.preventDefault();
    }

    event.stopImmediatePropagation();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const isScrollKey = SCROLL_KEYS.has(event.key);
    const isZoomShortcut =
      (event.ctrlKey || event.metaKey) &&
      ["+", "-", "=", "0"].includes(event.key);

    if (!isScrollKey && !isZoomShortcut) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    event.stopImmediatePropagation();
  };

  const handleMiddleClick = (event: MouseEvent) => {
    if (event.button !== 1) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    event.stopImmediatePropagation();
  };

  /**
   * wheel/touch prevention handles normal user input. This listener is a
   * second line of defence for scrollbar dragging or page scripts that change
   * the scroll position.
   */
  const handleUnexpectedScroll = () => {
    if (correctingScroll) {
      return;
    }

    const currentX = Math.round(window.scrollX || 0);
    const currentY = Math.round(window.scrollY || scrollElement.scrollTop || 0);

    const movedUnexpectedly =
      Math.abs(currentX - expectedX) > SCROLL_TOLERANCE_PX ||
      Math.abs(currentY - expectedY) > SCROLL_TOLERANCE_PX;

    if (!movedUnexpectedly) {
      return;
    }

    unexpectedMovementVersion += 1;
    correctingScroll = true;

    window.scrollTo(expectedX, expectedY);
    scrollElement.scrollTop = expectedY;

    requestAnimationFrame(() => {
      correctingScroll = false;
    });
  };

  window.addEventListener("wheel", preventInteraction, listenerOptions);
  window.addEventListener("touchmove", preventInteraction, listenerOptions);
  window.addEventListener("keydown", handleKeyDown, listenerOptions);
  window.addEventListener("mousedown", handleMiddleClick, listenerOptions);
  window.addEventListener("scroll", handleUnexpectedScroll, true);

  const htmlOverscroll = {
    value: document.documentElement.style.getPropertyValue(
      "overscroll-behavior",
    ),
    priority: document.documentElement.style.getPropertyPriority(
      "overscroll-behavior",
    ),
  };

  const bodyOverscroll = {
    value: document.body.style.getPropertyValue("overscroll-behavior"),
    priority: document.body.style.getPropertyPriority("overscroll-behavior"),
  };

  document.documentElement.style.setProperty(
    "overscroll-behavior",
    "none",
    "important",
  );
  document.body.style.setProperty("overscroll-behavior", "none", "important");

  // Prevent clicks, pointer drags, hover interactions, etc. from changing the
  // page while capture is in progress. Programmatic scrolling is unaffected.
  const shield = document.createElement("div");
  shield.setAttribute("data-screenshot-input-shield", "true");
  shield.style.setProperty("position", "fixed", "important");
  shield.style.setProperty("inset", "0", "important");
  shield.style.setProperty("width", "100vw", "important");
  shield.style.setProperty("height", "100vh", "important");
  shield.style.setProperty("z-index", "2147483647", "important");
  shield.style.setProperty("background", "transparent", "important");
  shield.style.setProperty("cursor", "progress", "important");
  shield.style.setProperty("pointer-events", "auto", "important");
  shield.style.setProperty("touch-action", "none", "important");
  document.documentElement.appendChild(shield);

  const restoreStyleProperty = (
    element: HTMLElement,
    property: string,
    value: string,
    priority: string,
  ) => {
    if (value) {
      element.style.setProperty(property, value, priority);
    } else {
      element.style.removeProperty(property);
    }
  };

  return {
    setExpectedPosition(x: number, y: number) {
      expectedX = Math.round(x);
      expectedY = Math.round(y);
    },

    getUnexpectedMovementVersion() {
      return unexpectedMovementVersion;
    },

    release() {
      window.removeEventListener("wheel", preventInteraction, true);
      window.removeEventListener("touchmove", preventInteraction, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousedown", handleMiddleClick, true);
      window.removeEventListener("scroll", handleUnexpectedScroll, true);

      restoreStyleProperty(
        document.documentElement,
        "overscroll-behavior",
        htmlOverscroll.value,
        htmlOverscroll.priority,
      );
      restoreStyleProperty(
        document.body,
        "overscroll-behavior",
        bodyOverscroll.value,
        bodyOverscroll.priority,
      );

      shield.remove();
    },
  };
};

const setExtensionVisibility = (visible: boolean) => {
  const extensionRoot = document.getElementById(EXTENSION_ROOT_ID);
  if (!extensionRoot) return;

  if (visible) {
    extensionRoot.style.removeProperty("display");
    extensionRoot.style.removeProperty("visibility");
    extensionRoot.style.removeProperty("pointer-events");
    return;
  }

  extensionRoot.style.setProperty("display", "none", "important");
  extensionRoot.style.setProperty("visibility", "hidden", "important");
  extensionRoot.style.setProperty("pointer-events", "none", "important");
};

/**
 * Sticky headers, fixed footers, chat buttons, and floating action bars are
 * painted at the same viewport coordinates in every captureVisibleTab image.
 * If they are left active, they repeat at every seam and cover real page
 * content. Temporarily put large edge bars back into normal document flow and
 * hide small floating widgets. Every original inline style is restored later.
 */
const neutralizeFloatingElementsForScreenshot = (): (() => void) => {
  const changedElements: Array<{
    element: HTMLElement;
    originalStyle: string | null;
  }> = [];

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const extensionRoot = document.getElementById(EXTENSION_ROOT_ID);

  document.querySelectorAll<HTMLElement>("body *").forEach((element) => {
    if (
      element === extensionRoot ||
      extensionRoot?.contains(element) ||
      element.hasAttribute("data-screenshot-input-shield") ||
      element.tagName === "SCRIPT" ||
      element.tagName === "STYLE"
    ) {
      return;
    }

    const computedStyle = window.getComputedStyle(element);
    const position = computedStyle.position;

    if (position !== "fixed" && position !== "sticky") {
      return;
    }

    const rect = element.getBoundingClientRect();
    const isVisible =
      computedStyle.display !== "none" &&
      computedStyle.visibility !== "hidden" &&
      Number.parseFloat(computedStyle.opacity || "1") > 0 &&
      rect.width > 0 &&
      rect.height > 0;

    if (!isVisible) {
      return;
    }

    changedElements.push({
      element,
      originalStyle: element.getAttribute("style"),
    });

    if (position === "sticky") {
      element.style.setProperty("position", "relative", "important");
      element.style.setProperty("top", "auto", "important");
      element.style.setProperty("right", "auto", "important");
      element.style.setProperty("bottom", "auto", "important");
      element.style.setProperty("left", "auto", "important");
      element.style.setProperty("transform", "none", "important");
      return;
    }

    const touchesTop = rect.top <= 8;
    const touchesBottom = rect.bottom >= viewportHeight - 8;
    const touchesLeft = rect.left <= 8;
    const touchesRight = rect.right >= viewportWidth - 8;
    const isWideBar = rect.width >= viewportWidth * 0.5;
    const isTallPanel = rect.height >= viewportHeight * 0.35;

    const isEdgeContent =
      (isWideBar && (touchesTop || touchesBottom)) ||
      (isTallPanel && (touchesLeft || touchesRight));

    if (isEdgeContent) {
      element.style.setProperty("position", "relative", "important");
      element.style.setProperty("top", "auto", "important");
      element.style.setProperty("right", "auto", "important");
      element.style.setProperty("bottom", "auto", "important");
      element.style.setProperty("left", "auto", "important");
      element.style.setProperty("transform", "none", "important");
      element.style.setProperty("max-width", "100%", "important");
    } else {
      element.style.setProperty("visibility", "hidden", "important");
      element.style.setProperty("pointer-events", "none", "important");
    }
  });

  return () => {
    for (let index = changedElements.length - 1; index >= 0; index -= 1) {
      const { element, originalStyle } = changedElements[index];

      if (originalStyle === null) {
        element.removeAttribute("style");
      } else {
        element.setAttribute("style", originalStyle);
      }
    }
  };
};

export const handleScreenshot = async (
  dispatch: AppDispatch,
  applicantMode: string,
) => {
  if (screenshotInProgress) {
    alert(
      "A screenshot is already being captured. Please wait for it to finish.",
    );
    return;
  }

  screenshotInProgress = true;

  const scrollElement =
    document.scrollingElement || document.documentElement || document.body;

  const originalX = window.scrollX;
  const originalY = window.scrollY;
  let resultMessage = "";

  const htmlScrollBehavior = {
    value: document.documentElement.style.getPropertyValue("scroll-behavior"),
    priority:
      document.documentElement.style.getPropertyPriority("scroll-behavior"),
  };

  const bodyScrollBehavior = {
    value: document.body.style.getPropertyValue("scroll-behavior"),
    priority: document.body.style.getPropertyPriority("scroll-behavior"),
  };

  const htmlScrollSnap = {
    value: document.documentElement.style.getPropertyValue("scroll-snap-type"),
    priority:
      document.documentElement.style.getPropertyPriority("scroll-snap-type"),
  };

  const bodyScrollSnap = {
    value: document.body.style.getPropertyValue("scroll-snap-type"),
    priority: document.body.style.getPropertyPriority("scroll-snap-type"),
  };

  const restoreStyleProperty = (
    element: HTMLElement,
    property: string,
    value: string,
    priority: string,
  ) => {
    if (value) {
      element.style.setProperty(property, value, priority);
    } else {
      element.style.removeProperty(property);
    }
  };

  const getFullHeight = () =>
    Math.max(
      scrollElement.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight,
    );

  const getActualScrollX = () => Math.round(window.scrollX || 0);

  const getActualScrollY = () =>
    Math.round(window.scrollY || scrollElement.scrollTop || 0);

  let restoreFloatingElements = () => {};
  let interactionLock: ScreenshotInteractionLock | null = null;

  const scrollToAndWait = async (
    requestedY: number,
    maximumY: number,
  ): Promise<number> => {
    const targetY = Math.max(0, Math.min(Math.round(requestedY), maximumY));

    // This movement is intentional. Tell the protection layer before moving.
    interactionLock?.setExpectedPosition(0, targetY);

    window.scrollTo(0, targetY);
    scrollElement.scrollTop = targetY;

    let previousY = -1;
    let stableFrames = 0;

    for (let frame = 0; frame < 30; frame += 1) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      const currentY = getActualScrollY();

      if (Math.abs(currentY - previousY) <= 1) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }

      previousY = currentY;

      if (
        Math.abs(currentY - targetY) <= SCROLL_TOLERANCE_PX &&
        stableFrames >= 2
      ) {
        break;
      }

      if (frame % 5 === 4) {
        interactionLock?.setExpectedPosition(0, targetY);
        window.scrollTo(0, targetY);
        scrollElement.scrollTop = targetY;
      }
    }

    await wait(150);
    return getActualScrollY();
  };

  try {
    setExtensionVisibility(false);

    document.documentElement.style.setProperty(
      "scroll-behavior",
      "auto",
      "important",
    );
    document.body.style.setProperty("scroll-behavior", "auto", "important");

    document.documentElement.style.setProperty(
      "scroll-snap-type",
      "none",
      "important",
    );
    document.body.style.setProperty("scroll-snap-type", "none", "important");

    restoreFloatingElements = neutralizeFloatingElementsForScreenshot();
    interactionLock = lockPageInteractionForScreenshot(scrollElement);

    await waitForPaint();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const canvasCssWidth = Math.min(
      viewportWidth,
      Math.max(
        scrollElement.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        viewportWidth,
      ),
    );

    // Give lazy-loaded sections a chance to render/expand before allocating the
    // final canvas. The loop limit prevents infinite-scroll pages from running
    // forever.
    let fullHeight = getFullHeight();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const maximumY = Math.max(0, fullHeight - viewportHeight);
      await scrollToAndWait(maximumY, maximumY);
      await waitForPaint();

      const expandedHeight = getFullHeight();

      if (expandedHeight <= fullHeight + 1) {
        break;
      }

      fullHeight = expandedHeight;
    }

    await scrollToAndWait(0, Math.max(0, fullHeight - viewportHeight));
    await waitForPaint();

    const overlap = 0;

    let stitchedCanvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let outputScale = 1;
    let drawnUntilY = 0;
    let targetY = 0;
    let captureCount = 0;

    /**
     * Scroll to a viewport, capture it, then verify that neither the scroll
     * position nor the viewport size changed while Chrome was capturing.
     *
     * The movement version catches even a temporary movement that gets restored
     * before captureVisibleTab() resolves.
     */
    const captureStableViewport = async (
      requestedY: number,
      maximumY: number,
    ): Promise<{
      dataUrl: string;
      actualScrollY: number;
    }> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const settledY = await scrollToAndWait(requestedY, maximumY);
        await waitForPaint();

        const beforeX = getActualScrollX();
        const beforeY = getActualScrollY();
        const movementVersionBefore =
          interactionLock?.getUnexpectedMovementVersion() ?? 0;

        if (
          Math.abs(beforeX) > SCROLL_TOLERANCE_PX ||
          Math.abs(beforeY - settledY) > SCROLL_TOLERANCE_PX
        ) {
          continue;
        }

        if (
          window.innerWidth !== viewportWidth ||
          window.innerHeight !== viewportHeight
        ) {
          throw new Error(
            "The browser viewport changed while the screenshot was being captured.",
          );
        }

        try {
          const dataUrl = await captureVisibleTabRateLimited();

          const afterX = getActualScrollX();
          const afterY = getActualScrollY();
          const movementVersionAfter =
            interactionLock?.getUnexpectedMovementVersion() ?? 0;

          const viewportChanged =
            window.innerWidth !== viewportWidth ||
            window.innerHeight !== viewportHeight;

          const movedDuringCapture =
            movementVersionAfter !== movementVersionBefore ||
            Math.abs(afterX - beforeX) > SCROLL_TOLERANCE_PX ||
            Math.abs(afterY - beforeY) > SCROLL_TOLERANCE_PX;

          if (!viewportChanged && !movedDuringCapture) {
            return {
              dataUrl,
              actualScrollY: beforeY,
            };
          }

          lastError = new Error(
            viewportChanged
              ? "The browser viewport changed during capture."
              : "The page moved during capture.",
          );
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }

        await wait(CAPTURE_MIN_INTERVAL_MS);
      }

      throw (
        lastError ??
        new Error("The page kept moving while the screenshot was captured.")
      );
    };

    while (drawnUntilY < fullHeight) {
      const maximumY = Math.max(0, fullHeight - viewportHeight);

      let capturedViewport = await captureStableViewport(targetY, maximumY);

      // Never allow a site-controlled jump to create a gap in the stitched
      // image. Re-capture from the first undrawn position if necessary.
      if (capturedViewport.actualScrollY > drawnUntilY + 1) {
        capturedViewport = await captureStableViewport(
          Math.max(0, drawnUntilY - overlap),
          maximumY,
        );
      }

      const actualScrollY = capturedViewport.actualScrollY;
      const screenshot = await loadImage(capturedViewport.dataUrl);

      const sourceScaleX = screenshot.width / viewportWidth;
      const sourceScaleY = screenshot.height / viewportHeight;

      if (!stitchedCanvas || !ctx) {
        const nativeScale = Math.min(sourceScaleX, sourceScaleY);

        const dimensionScale = Math.min(
          32760 / Math.max(1, canvasCssWidth),
          32760 / Math.max(1, fullHeight),
        );

        const areaScale = Math.sqrt(
          120_000_000 / Math.max(1, canvasCssWidth * fullHeight),
        );

        outputScale = Math.max(
          0.1,
          Math.min(nativeScale, dimensionScale, areaScale),
        );

        stitchedCanvas = document.createElement("canvas");
        stitchedCanvas.width = Math.max(
          1,
          Math.round(canvasCssWidth * outputScale),
        );
        stitchedCanvas.height = Math.max(
          1,
          Math.round(fullHeight * outputScale),
        );

        ctx = stitchedCanvas.getContext("2d");

        if (!ctx) {
          throw new Error("Canvas context unavailable");
        }
      }

      const captureTopY = Math.max(0, actualScrollY);
      const captureBottomY = Math.min(fullHeight, captureTopY + viewportHeight);

      const destinationTopY = Math.max(drawnUntilY, captureTopY);
      const drawHeight = captureBottomY - destinationTopY;

      if (drawHeight <= 0) {
        throw new Error(
          "The page stopped scrolling before the full screenshot was captured.",
        );
      }

      const sourceTopY = destinationTopY - captureTopY;
      const sourceWidth = Math.min(
        screenshot.width,
        Math.round(canvasCssWidth * sourceScaleX),
      );

      ctx.drawImage(
        screenshot,
        0,
        Math.round(sourceTopY * sourceScaleY),
        sourceWidth,
        Math.round(drawHeight * sourceScaleY),
        0,
        Math.round(destinationTopY * outputScale),
        Math.round(canvasCssWidth * outputScale),
        Math.round(drawHeight * outputScale),
      );

      const previousDrawnUntilY = drawnUntilY;
      drawnUntilY = captureBottomY;
      captureCount += 1;

      if (drawnUntilY <= previousDrawnUntilY) {
        throw new Error(
          "Unable to advance the page while taking the screenshot.",
        );
      }

      if (drawnUntilY >= fullHeight) {
        break;
      }

      targetY = Math.min(maximumY, drawnUntilY);

      if (captureCount > Math.ceil(fullHeight / 100) + 50) {
        throw new Error("Too many screenshot segments were required.");
      }
    }

    if (!stitchedCanvas) {
      throw new Error("No screenshot data was captured.");
    }

    const screenshotBlob = await canvasToBlob(stitchedCanvas);

    if (applicantMode === "individual") {
      await dispatch(
        uploadIndividualSessionScreenshot(screenshotBlob),
      ).unwrap();
    }

    if (applicantMode === "va") {
      await dispatch(uploadOrgSessionScreenshot(screenshotBlob)).unwrap();
    }

    if (applicantMode === "applicant") {
      await dispatch(uploadApplicantSessionScreenshot(screenshotBlob)).unwrap();
    }

    resultMessage = "Screenshot uploaded successfully.";
  } catch (error: any) {
    console.error("Unable to capture or upload screenshot:", error);

    const message =
      error?.message ||
      error?.error ||
      (error instanceof Error
        ? error.message
        : "Unable to capture or upload screenshot on this page.");

    resultMessage = `Unable to capture or upload screenshot: ${message}`;
  } finally {
    // Release the lock before restoring the user's original scroll position.
    interactionLock?.release();
    interactionLock = null;

    restoreFloatingElements();

    restoreStyleProperty(
      document.documentElement,
      "scroll-behavior",
      htmlScrollBehavior.value,
      htmlScrollBehavior.priority,
    );
    restoreStyleProperty(
      document.body,
      "scroll-behavior",
      bodyScrollBehavior.value,
      bodyScrollBehavior.priority,
    );
    restoreStyleProperty(
      document.documentElement,
      "scroll-snap-type",
      htmlScrollSnap.value,
      htmlScrollSnap.priority,
    );
    restoreStyleProperty(
      document.body,
      "scroll-snap-type",
      bodyScrollSnap.value,
      bodyScrollSnap.priority,
    );

    setExtensionVisibility(true);
    window.scrollTo(originalX, originalY);

    screenshotInProgress = false;
  }

  if (resultMessage) {
    alert(resultMessage);
  }
};
