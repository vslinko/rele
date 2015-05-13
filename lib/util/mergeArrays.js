export default function mergeArrays(a, b) {
  return a.concat(b.filter(c => a.indexOf(c) < 0));
}
