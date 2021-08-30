const W = window;
const { devicePixelRatio: dpr } = W;

const subscribe = (target, type, listener, options = false) => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
};

const dispatch = (target, type) => target.dispatchEvent(new Event(type));

subscribe(W, 'resize', () => {
  const { innerWidth: w, innerHeight: h } = W;

  c.width = w * dpr;
  c.height = h * dpr;

  c.style.width = `${c.width}px`;
  c.style.height = `${c.height}px`;
  c.style.transform = `scale(${1 / dpr})`;
});

dispatch(W, 'resize');

io({ upgrade: false, transports: ['websocket'] });
