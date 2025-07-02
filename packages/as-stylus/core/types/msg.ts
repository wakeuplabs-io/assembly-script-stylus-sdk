import { msg_sender } from "../modules/hostio";
import { malloc } from "../modules/memory";

export class Msg {
  private constructor() {}

  public static sender(): usize {
    const ptr = malloc(32);
    for (let i = 0; i < 12; i++) {
      store<u8>(ptr + i, 0);
    }

    msg_sender(ptr + 12);

    return ptr;
  }
}
