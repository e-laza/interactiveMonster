document.addEventListener("DOMContentLoaded", () => {
  const EASING_FACTOR = 0.16;
  const MOVEMENT_RANGE = 5; // Base movement range in pixels
  
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = null;
  let eyeData = [];

  const getClipPathBox = (root, clipPathUrl) => {
    if (!clipPathUrl) {
      return null;
    }

    const match = clipPathUrl.match(/url\(['"]?#([^)'"]*)['"]?\)/);
    if (!match) {
      return null;
    }

    const clipPathId = match[1];
    
    // Try to find clipPath in the root or any parent SVG
    let clipPath = root.getElementById ? root.getElementById(clipPathId) : null;
    
    // If not found and root is an element, try searching up to find it
    if (!clipPath && root.ownerDocument) {
      clipPath = root.ownerDocument.getElementById(clipPathId);
    }
    
    // Also try querySelector as fallback
    if (!clipPath) {
      clipPath = document.querySelector(`#${clipPathId}`);
    }
    
    if (!clipPath) {
      console.warn(`Could not find clipPath with id: ${clipPathId}`);
      return null;
    }

    const clipShape = clipPath.querySelector("path, circle, ellipse, rect, polygon, polyline");
    if (!clipShape) {
      console.warn(`No shape found in clipPath: ${clipPathId}`);
      return null;
    }

    try {
      // Firefox bug: getBBox() returns 0 for paths with fill="none"
      // Solution: temporarily add a fill, get bbox, then remove it
      const originalFill = clipShape.getAttribute("fill");
      clipShape.setAttribute("fill", "black");
      
      const bbox = clipShape.getBBox();
      
      // Restore original fill
      if (originalFill) {
        clipShape.setAttribute("fill", originalFill);
      } else {
        clipShape.setAttribute("fill", "none");
      }
      
      console.log(`ClipPath ${clipPathId} bbox:`, bbox);
      
      // Validate bbox
      if (bbox.width === 0 || bbox.height === 0) {
        console.warn(`ClipPath ${clipPathId} has zero dimensions, using defaults`);
        // Return a reasonable default size
        return { x: 0, y: 0, width: 10, height: 10 };
      }
      
      return bbox;
    } catch (e) {
      console.warn("Could not get bounding box for clip path:", clipPathId, e);
      return null;
    }
  };

  const computeEyeData = (root) => {
    // Find all iris elements
    const irises = Array.from(root.querySelectorAll("[id^='EYE_IRIS_']"));
    console.log(`Found ${irises.length} iris elements in root:`, root);
    
    return irises.map((iris, index) => {
      // Get the clipped group (parent of iris)
      const clipGroup = iris.parentElement;
      if (!clipGroup || !clipGroup.hasAttribute("clip-path")) {
        console.warn("Iris has no clipped parent group:", iris.id);
        return null;
      }

      const clipPathUrl = clipGroup.getAttribute("clip-path");
      const clipBox = getClipPathBox(root, clipPathUrl);
      
      if (!clipBox) {
        console.warn("Missing clip bounding box for:", iris.id, "clipPathUrl:", clipPathUrl);
        return null;
      }

      // Log first eye's details
      if (index === 0) {
        console.log(`First eye (${iris.id}):`);
        console.log(`  Clip path URL: ${clipPathUrl}`);
        console.log(`  Clip box:`, clipBox);
        console.log(`  Parent element:`, clipGroup);
      }

      // Use a percentage of the clip box size for movement range
      const moveRangeX = clipBox.width * 0.3; // 30% of clip width
      const moveRangeY = clipBox.height * 0.3; // 30% of clip height

      console.log(`Eye ${iris.id}: moveRange=(${moveRangeX.toFixed(2)}, ${moveRangeY.toFixed(2)}), clipSize=(${clipBox.width.toFixed(2)}, ${clipBox.height.toFixed(2)})`);

      return {
        clipGroup,
        iris,
        moveRangeX,
        moveRangeY,
      };
    }).filter(Boolean); // Remove null entries
  };

  const setupEyeTracking = (root) => {
    eyeData = computeEyeData(root);
    
    console.log(`Computed eyeData length: ${eyeData.length}`);
    if (eyeData.length > 0) {
      console.log(`First eye data:`, eyeData[0]);
    }
    
    if (!eyeData.length) {
      console.warn("No valid eye elements found - eyeData is empty!");
      return false;
    }

    console.log(`Tracking ${eyeData.length} eyes`);

    const update = () => {
      currentX += (targetX - currentX) * EASING_FACTOR;
      currentY += (targetY - currentY) * EASING_FACTOR;

      eyeData.forEach(({ clipGroup, moveRangeX, moveRangeY }, index) => {
        // Calculate movement based on target position and available range
        const moveX = currentX * moveRangeX;
        const moveY = currentY * moveRangeY;
        
        // Debug first eye only to avoid spam
        if (index === 0 && (Math.abs(targetX) > 0.1 || Math.abs(targetY) > 0.1)) {
          console.log(`Target: (${targetX.toFixed(2)}, ${targetY.toFixed(2)}) => Move: (${moveX.toFixed(2)}, ${moveY.toFixed(2)}), Range: (${moveRangeX.toFixed(2)}, ${moveRangeY.toFixed(2)})`);
        }
        
        // Apply transform to the clipped group
        clipGroup.setAttribute("transform", `translate(${moveX}, ${moveY})`);
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

  const attachPointerListeners = (root) => {
    window.addEventListener("pointermove", setTargetFromEvent, { passive: true });
    window.addEventListener("pointerleave", resetTarget, { passive: true });
    window.addEventListener("blur", resetTarget, { passive: true });
    window.addEventListener("resize", () => {
      if (eyeData.length && root) {
        eyeData = computeEyeData(root);
      }
    });
  };

  // Try inline SVG first - look for the actual layer with the irises
  const layerSvg = document.querySelector("#Layer_1, #monster svg");
  if (layerSvg && setupEyeTracking(layerSvg)) {
    attachPointerListeners(layerSvg);
    return;
  }

  // Try outer monster SVG
  const inlineSvg = document.querySelector("#monster");
  if (inlineSvg && setupEyeTracking(inlineSvg)) {
    attachPointerListeners(inlineSvg);
    return;
  }

  // Try document root if no inline SVG with id
  if (setupEyeTracking(document)) {
    attachPointerListeners(document);
    return;
  }

  // Fallback to object/embed SVG
  const svgObject = document.querySelector(
    "object[type='image/svg+xml'], object[data$='.svg'], embed[type='image/svg+xml'], embed[src$='.svg']"
  );
  if (!svgObject) {
    console.warn("No SVG found in document");
    return;
  }

  const tryInit = () => {
    if (!svgObject.contentDocument) {
      return;
    }
    if (setupEyeTracking(svgObject.contentDocument)) {
      attachPointerListeners(svgObject.contentDocument);
    }
  };

  svgObject.addEventListener("load", tryInit);
  tryInit();
});
