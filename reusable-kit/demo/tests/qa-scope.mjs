// Keep narrow-screen assertions available without resizing routine desktop runs.
export const mobileQa = process.env.PAPERWORK_MOBILE_QA === "1";
export const layoutWidths = mobileQa ? [390] : [1440, 1920];
export const layoutViewports = (mobileQa ? [1280, 390] : layoutWidths)
  .map(width => ({ width, height: width === 1920 ? 1080 : width === 390 ? 844 : 900 }));
