import * as React from "react";

export function SetUserPage({ setUser }: { setUser: (user: string) => void }) {
  let inputEl: HTMLInputElement | null = null;

  const handleClick = () => setUser(inputEl!.value);
  return (
    <div className="set-user-page">
      <input ref={el => (inputEl = el)} className="user-input" placeholder="TS" />
      <button onClick={handleClick}>Set Player Initials</button>
    </div>
  );
}
