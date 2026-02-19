document.addEventListener("DOMContentLoaded", () => {
  const easing = 0.16;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = null;
  let irisBounds = [];

  const applyEyeStyles = (iris) => {
    iris.style.transformBox = "fill-box";
    iris.style.transformOrigin = "center";
    iris.style.willChange = "transform";
  };

  const getClipPathBox = (root, clipPathUrl) => {
    if (!clipPathUrl) {
      return null;
    }

    const match = clipPathUrl.match(/url\(#([^)]+)\)/);
    if (!match) {
      return null;
    }

    const clipPath = root.getElementById(match[1]);
    if (!clipPath) {
      return null;
    }

    const clipShape = clipPath.querySelector("path, circle, ellipse, rect, polygon, polyline");
    if (!clipShape) {
      return null;
    }

    return clipShape.getBBox();
  };

  const computeIrisBounds = (root, irises) => {
    return irises.map((iris) => {
      const clipGroup = iris.closest("[clip-path]");
      const clipBox = clipGroup ? getClipPathBox(root, clipGroup.getAttribute("clip-path")) : null;
      const irisBox = iris.getBBox();

      if (!clipBox || !irisBox) {
        return {
          iris,
          negX: 0,
          posX: 0,
          negY: 0,
          posY: 0,
        };
      }

      const irisCenterX = irisBox.x + irisBox.width / 2;
      const irisCenterY = irisBox.y + irisBox.height / 2;

      const negX = clipBox.x - irisCenterX;
      const posX = clipBox.x + clipBox.width - irisCenterX;
      const negY = clipBox.y - irisCenterY;
      const posY = clipBox.y + clipBox.height - irisCenterY;

      return {
        iris,
        negX,
        posX,
        negY,
        posY,
      };
    });
  };

  const setupEyeTracking = (root) => {
    const irises = Array.from(root.querySelectorAll("[id^='EYE_IRIS_']"));
    if (!irises.length) {
      return false;
    }

    irises.forEach(applyEyeStyles);
    irisBounds = computeIrisBounds(root, irises);

    const update = () => {
      currentX += (targetX - currentX) * easing;
      currentY += (targetY - currentY) * easing;

      irisBounds.forEach(({ iris, negX, posX, negY, posY }) => {
        const x = currentX >= 0 ? currentX * posX : currentX * -negX;
        const y = currentY >= 0 ? currentY * posY : currentY * -negY;
        iris.style.transform = `translate(${x}px, ${y}px)`;
      });

      rafId = requestAnimationFrame(update);
    };

    if (!rafId) {
      rafId = requestAnimationFrame(update);
    }

    return true;
  };

  const setTargetFromEvent = (event) => {
    const { innerWidth, innerHeight } = window;
    const x = (event.clientX / innerWidth - 0.5) * 2;
    const y = (event.clientY / innerHeight - 0.5) * 2;
    targetX = Math.max(-1, Math.min(1, x));
    targetY = Math.max(-1, Math.min(1, y));
  };

  const resetTarget = () => {
    targetX = 0;
    targetY = 0;
  };

  const attachPointerListeners = () => {
    window.addEventListener("pointermove", setTargetFromEvent, { passive: true });
    window.addEventListener("pointerleave", resetTarget, { passive: true });
    window.addEventListener("blur", resetTarget, { passive: true });
    window.addEventListener("resize", () => {
      if (irisBounds.length) {
        const root = irisBounds[0].iris.ownerSVGElement;
        if (root) {
          irisBounds = computeIrisBounds(root, irisBounds.map(({ iris }) => iris));
        }
      }
    });
  };

  if (setupEyeTracking(document)) {
    attachPointerListeners();
    return;
  }

  const svgObject = document.querySelector(
    "object[type='image/svg+xml'], object[data$='.svg'], embed[type='image/svg+xml'], embed[src$='.svg']"
  );
  if (!svgObject) {
    return;
  }

  const tryInit = () => {
    if (!svgObject.contentDocument) {
      return;
    }
    if (setupEyeTracking(svgObject.contentDocument)) {
      attachPointerListeners();
    }
  };

  svgObject.addEventListener("load", tryInit);
  tryInit();
});
