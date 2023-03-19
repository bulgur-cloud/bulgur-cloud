(() => {
  const theme = localStorage.getItem("bulgur-theme");
  console.log(theme);
  if (theme) {
    document.getElementsByTagName("html")[0].setAttribute("data-theme", theme);
  }
})();
