import { findBestMatchExpression } from "../ast";

import getSymbols from "../../workers/parser/getSymbols";
import { getSource } from "../../workers/parser/tests/helpers";
import { parseScript } from "../../workers/parser/utils/ast";

describe("find the best expression for the token", () => {
  it("should find the identifier", () => {
    const source = getSource("computed-props");
    const symbols = getSymbols(source);

    const expression = findBestMatchExpression(
      symbols,
      { line: 1, column: 13 },
      "key"
    );
    expect(expression).toMatchSnapshot();
  });

  it.only("test babylon7", () => {
    const time = Date.now();
    const source = getSource("debugger");
    getSymbols(source);
    console.log(Date.now() - time);
  });

  it("should find the expression for the property", () => {
    const source = getSource("computed-props");
    const symbols = getSymbols(source);

    const expression = findBestMatchExpression(
      symbols,
      { line: 6, column: 16 },
      "b"
    );
    expect(expression).toMatchSnapshot();
  });

  it("should find the identifier for computed member expressions", () => {
    const source = getSource("computed-props");
    const symbols = getSymbols(source);

    const expression = findBestMatchExpression(
      symbols,
      { line: 5, column: 6 },
      "key"
    );
    expect(expression).toMatchSnapshot();
  });
});
