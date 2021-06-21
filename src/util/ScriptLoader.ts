
export const ScriptLoader = (doc: Document, src: string, callback: () => void) => {
  console.log('appending script');
  const script = doc.createElement('script');
  script.src = src;
  script.onload = callback;
  doc.body.appendChild(script);
  console.log('script appended');
};