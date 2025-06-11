import figlet from "figlet";

const WIDTH = 80;
const TITLE = "Ghitgud";
const FONT = "Standard";
const WHITESPACE_BREAK = true;
const VERTICAL_LAYOUT = "default";
const HORIZONTAL_LAYOUT = "default";

const ascii = figlet.textSync(TITLE, {
  font: FONT,
  width: WIDTH,
  verticalLayout: VERTICAL_LAYOUT,
  whitespaceBreak: WHITESPACE_BREAK,
  horizontalLayout: HORIZONTAL_LAYOUT,
});

export default ascii;
