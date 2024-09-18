const RenderName = (props: any) => {
  const { item, resumeList } = props;

  const getRoleById = (roleiId, customRole) => {
    if (roleiId) {
      const role = resumeList.allRoles.filter((role) => {
        return role.id === roleiId;
      });
      if (!role || role.length === 0) {
        return null;
      }
      return role[0].title;
    }
    if (customRole) {
      return customRole?.label;
    }
  };

  const role = getRoleById(item.preferredRole, item.customPreferredRole);

  const roleString = role ? `  (${role}) ` : "";

  if (item?.title) {
    return `${item.title} ${roleString}`;
  }
  if (item?.name) {
    return `${item.name} ${roleString}`;
  }
  return `Untitled Resume ${roleString}`;
};
export default RenderName;
