import { uploadOrgSessionScreenshot } from "../../store/features/Organization/OrgApi";
import { uploadIndividualSessionScreenshot } from "../../store/features/ResumeList/ResumeListApi";
import { AppDispatch } from "../../store/store";
import { EXTENSION_ACTION, EXTENSION_ROOT_ID } from "../../utils/constant";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

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
      // Sticky elements already occupy space in normal flow. Relative removes
      // the sticking behavior without removing the element or its content.
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
      // Headers, footers, cookie bars, and side panels are useful content.
      // Move them into normal flow so they appear only once instead of in
      // every viewport screenshot.
      element.style.setProperty("position", "relative", "important");
      element.style.setProperty("top", "auto", "important");
      element.style.setProperty("right", "auto", "important");
      element.style.setProperty("bottom", "auto", "important");
      element.style.setProperty("left", "auto", "important");
      element.style.setProperty("transform", "none", "important");
      element.style.setProperty("max-width", "100%", "important");
    } else {
      // Small floating widgets do not belong to a document position. Hiding
      // them prevents the same button/badge from being repeated 3-5 times.
      element.style.setProperty("visibility", "hidden", "important");
      element.style.setProperty("pointer-events", "none", "important");
    }
  });

  return () => {
    // Restore in reverse order because fixed/sticky elements may be nested.
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
  const scrollElement =
    document.scrollingElement || document.documentElement || document.body;
  const originalX = window.scrollX;
  const originalY = window.scrollY;
  let resultMessage = "";

  // Smooth scrolling and scroll snapping can leave the page between two
  // requested positions when captureVisibleTab runs. Save and temporarily
  // disable both so each screenshot has a reliable document position.
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

  const getActualScrollY = () =>
    Math.round(window.scrollY || scrollElement.scrollTop || 0);

  const scrollToAndWait = async (
    requestedY: number,
    maximumY: number,
  ): Promise<number> => {
    const targetY = Math.max(0, Math.min(Math.round(requestedY), maximumY));

    window.scrollTo(0, targetY);
    scrollElement.scrollTop = targetY;

    let previousY = -1;
    let stableFrames = 0;

    // Wait until the actual scroll position stops changing. Re-issuing the
    // scroll periodically also prevents site scripts from leaving it midway.
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

      if (Math.abs(currentY - targetY) <= 1 && stableFrames >= 2) {
        break;
      }

      if (frame % 5 === 4) {
        window.scrollTo(0, targetY);
        scrollElement.scrollTop = targetY;
      }
    }

    await wait(150);
    return getActualScrollY();
  };

  let restoreFloatingElements = () => {};

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

  try {
    restoreFloatingElements = neutralizeFloatingElementsForScreenshot();
    await waitForPaint();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // captureVisibleTab only captures the visible horizontal viewport.
    // Using a wider document width would create an unfilled area on the right.
    const canvasCssWidth = Math.min(
      viewportWidth,
      Math.max(
        scrollElement.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        viewportWidth,
      ),
    );

    // Give lazy-loaded sections a chance to expand the document before the
    // output canvas is created. The limit prevents infinite-scroll pages from
    // loading forever.
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

    // Do not intentionally overlap captures. The previous 120-240px
    // overlap could appear as duplicated content when two images were
    // stitched. Any overlap caused by browser scroll clamping is still
    // removed below using actualScrollY and drawnUntilY.
    const overlap = 0;

    let stitchedCanvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let outputScale = 1;
    let drawnUntilY = 0;
    let targetY = 0;
    let captureCount = 0;

    while (drawnUntilY < fullHeight) {
      const maximumY = Math.max(0, fullHeight - viewportHeight);
      let actualScrollY = await scrollToAndWait(targetY, maximumY);
      await waitForPaint();

      // A page script may still force a scroll position. Never allow that to
      // create an uncaptured gap.
      if (actualScrollY > drawnUntilY + 1) {
        actualScrollY = await scrollToAndWait(
          Math.max(0, drawnUntilY - overlap),
          maximumY,
        );
        await waitForPaint();
      }

      const dataUrl = await captureVisibleTab();
      const screenshot = await loadImage(dataUrl);

      const sourceScaleX = screenshot.width / viewportWidth;
      const sourceScaleY = screenshot.height / viewportHeight;

      if (!stitchedCanvas || !ctx) {
        // Keep as much native screenshot detail as possible while staying
        // below common browser canvas dimension and memory limits.
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

      // Draw only the part that has not already been drawn. This is the key
      // difference from incrementing by viewportHeight: the stitch follows
      // the actual browser scroll position, not the requested one.
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

      // Continue exactly where the previous capture ended. If the browser
      // clamps the final scroll position, destinationTopY/sourceTopY above
      // crop the already-drawn portion automatically.
      targetY = Math.min(maximumY, drawnUntilY);

      // Safety guard for pages that continuously manipulate their own scroll.
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
  }

  if (resultMessage) {
    alert(resultMessage);
  }
};
