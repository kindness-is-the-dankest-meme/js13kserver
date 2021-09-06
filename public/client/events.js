/**
 * events
 */
export const subscribe = (target, type, listener, options = false) => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
};

export const dispatch = (target, type) => target.dispatchEvent(new Event(type));
