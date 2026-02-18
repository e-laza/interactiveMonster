document.addEventListener("DOMContentLoaded", () => {

  const irises = document.querySelectorAll("[id^='EYE_'][id$='_IRIS']");

  let lookDirection = 1;

  setInterval(() => {
    irises.forEach(iris => {
      iris.style.transform = `translate(${lookDirection * 3}px, 0px)`;
    });

    lookDirection *= -1;

  }, 2000);

});
