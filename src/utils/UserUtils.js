const parseUserComms = (user) => {
  let userEmail = "";
  let userPhone = "";
  user?.["Person-comms"]?.forEach((comm) => {
    if (comm["type"] === "email") {
      userEmail = comm["addressOrNumber"];
    } else if (comm["type"] === "mobile" || comm["type"] === "workPhone") {
      userPhone = comm["addressOrNumber"];
    }
  });
  return { userEmail, userPhone };
};

export { parseUserComms };
