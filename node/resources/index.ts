import { Segment} from './segment'

export class Resources {
  public segment: Segment

  constructor(ctx: Context) {
    this.segment = new Segment(ctx.vtex, {})
  }
}
