import { useState } from "react";
import OpenPositionForm from "./OpenPositionForm.jsx";
import UnrealizedPnl from "./UnrealizedPnl.jsx";

function OpenPositions({ positions, onSave, onDelete, storageError }) {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");

  function save(draft, id) {
    if (onSave(draft, id)) {
      setForm(null);
      setMessage(id ? "Position updated." : "Position saved.");
    }
  }

  function removePosition(position) {
    const confirmed = window.confirm(
      `Delete ${position.symbol} (${position.quantity}, opened ${position.openDate}) from your journal? This cannot be undone.`
    );
    if (!confirmed) return;

    setMessage("");
    if (onDelete(position.id)) {
      if (form?.id === position.id) setForm(null);
      setMessage("Position deleted.");
    }
  }

  return (
    <section className="list-opened" aria-labelledby="open-positions-title">
      <header className="positions-heading">
        <h2 id="open-positions-title">Open positions</h2>
        <span>{positions.length} {positions.length === 1 ? "holding" : "holdings"}</span>
      </header>
      <p className="positions-help">A home for your long-term investments.</p>
      {storageError && <p className="positions-error" role="alert">{storageError}</p>}
      
        {form ? (
        <OpenPositionForm key={form.id ?? "new"} position={form.id ? form : undefined}
          onSave={save} onCancel={() => setForm(null)} />
      ) : (<button className="open-position-add" type="button" onClick={() => { setMessage(""); setForm({}); }}>
          + Add a holding
        </button>)
}
      
      <p className="positions-help" role="status">{message}</p>
      {positions.length === 0 ? (!form && (
        <div className="holding-empty">
          <span className="holding-empty-symbol" aria-hidden="true">+</span>
          <h3>Your portfolio starts here</h3>
          <p>Add your first holding to keep your entry details in one place.</p>
        </div>
      )) : (
        <ul className="open-position-list">
          {[...positions].sort((a, b) => b.openDate.localeCompare(a.openDate)).map((position) => (
            <li key={position.id} className="open-position-card">
              <header>
                <strong>{position.symbol}</strong>
                <div className="holding-card-actions">
                  <button type="button" aria-label={`Edit ${position.symbol} position`} onClick={() => {
                    setMessage(""); setForm(position);
                  }}>Edit</button>
                  <button type="button" className="holding-delete"
                    aria-label={`Delete ${position.symbol} position`}
                    onClick={() => removePosition(position)}>Delete</button>
                </div>
              </header>
              <p className="positions-help">
                {[position.assetType.toUpperCase(), position.exchange, position.broker].filter(Boolean).join(" · ")}
              </p>
              <dl>
                <div><dt>Direction</dt><dd>{position.side === "buy" ? "Buy / Long" : "Sell / Short"}</dd></div>
                <div><dt>Quantity</dt><dd>{position.quantity}</dd></div>
                <div><dt>Entry price</dt><dd>{position.entryPrice} {position.currency}</dd></div>
                <div><dt>Opened</dt><dd><time dateTime={position.openDate}>{position.openDate}</time></dd></div>
              </dl>
              <UnrealizedPnl position={position} />
            </li>
          ))}
        </ul>
      )}
      


    </section>
  );
}

export default OpenPositions;
