import { IHVMLElement } from "../types/elements";

class Data {
  static getJsonBoilerplate(): Partial<IHVMLElement> {
    return {
      "@context": "https://redblue.video/guide/hvml.context.jsonld",
    };
  }
}

export default Data;
