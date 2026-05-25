export type PlayerActionFrame = {
  seq: number;
  sprint: boolean;
  primary: boolean;
  secondary: boolean;
};

export function actionFrame(seq: number, sprint: boolean, primary: boolean, secondary: boolean): PlayerActionFrame {
  return { seq, sprint, primary, secondary };
}
