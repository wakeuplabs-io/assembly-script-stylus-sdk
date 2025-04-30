import { debugLogI32, debugLogI64 } from "../modules/console";
import { msg_sender } from "../modules/hostio";
import { address } from "./address";
import { malloc } from "./memory";

export class Msg {
  private constructor() { }

  public static sender(): address {
    const msgSenderPtr = malloc(20);
    msg_sender(msgSenderPtr);
    return msgSenderPtr;
  }
}