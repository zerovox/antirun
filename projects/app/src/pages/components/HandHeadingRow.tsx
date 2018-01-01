import * as React from "react";

export interface HandHeadingRowProps {
  handNumber: number;
}

export function HandHeadingRow(props: HandHeadingRowProps) {
  return (
    <tr className="pass-row">
      {props.handNumber === 0 && (
        <td colSpan={4} className="pass">
          &#8592; Pass Left
        </td>
      )}
      {props.handNumber === 1 && (
        <td colSpan={4} className="pass">
          Pass Right
        </td>
      )}
      {props.handNumber === 2 && (
        <td colSpan={4} className="pass">
          Pass Across
        </td>
      )}
      {props.handNumber === 3 && (
        <td colSpan={4} className="pass">
          Keeper
        </td>
      )}
    </tr>
  );
}
