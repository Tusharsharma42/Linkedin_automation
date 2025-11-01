import React, { useEffect } from "react";
import { analytics } from "./firebase";
import { logEvent } from "firebase/analytics";

function App() {
  useEffect(() => {
    logEvent(analytics, "page_viewed");
  }, []);

  return (
    <div>
      <h1>Firebase Analytics Connected!</h1>
    </div>
  );
}

export default App;
