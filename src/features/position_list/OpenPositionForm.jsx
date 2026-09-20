import { useId, useState } from "react";
import { todayDate, validateOpenPosition } from "../../utils/openPositions.js";

function OpenPositionForm({ position, onSave, onCancel }) {
  const formId = useId();
  const [error, setError] = useState("");
  const fieldId = (name) => `${formId}-${name}`;

  function handleSubmit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const draft = {
      symbol: fields.get("symbol").trim(),
      assetType: fields.get("assetType"),
      exchange: fields.get("exchange").trim(),
      broker: fields.get("broker").trim(),
      side: fields.get("side"),
      quantity: Number(fields.get("quantity")),
      entryPrice: Number(fields.get("entryPrice")),
      currency: fields.get("currency").trim().toUpperCase(),
      openDate: fields.get("openDate"),
    };
    const message = validateOpenPosition(draft);
    setError(message);
    if (!message) onSave(draft, position?.id);
  }

  return (
    <form className="open-position-form" onSubmit={handleSubmit} aria-labelledby={fieldId("title")}>
      <header className="holding-form-intro">
        <span className="holding-form-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 17V11M12 17V7M19 17V3M3 21h18" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="holding-form-eyebrow">Your portfolio</p>
          <h3 id={fieldId("title")}>{position ? "Update your holding" : "Add a new holding"}</h3>
          <p className="holding-form-description">A few details to keep your investments in view.</p>
        </div>
      </header>

      <fieldset className="holding-form-section">
        <legend>What are you investing in?</legend>
        <div className="open-position-fields">
        <div className="holding-field-wide">
          <label htmlFor={fieldId("symbol")}>Market ticker</label>
          <input id={fieldId("symbol")} name="symbol" required maxLength={100}
            defaultValue={position?.symbol ?? ""} placeholder="e.g. AAPL" />
          <small>Use the ticker, not the company name. Massive Basic supplies daily prices for US stocks and ETFs.</small>
        </div>
        <div>
          <label htmlFor={fieldId("assetType")}>Asset type</label>
          <select id={fieldId("assetType")} name="assetType" defaultValue={position?.assetType ?? "stock"}>
            <option value="stock">Stock</option>
            <option value="etf">ETF</option>
            <option value="cfd">CFD</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor={fieldId("currency")}>Price currency</label>
          <input id={fieldId("currency")} name="currency" required pattern="[A-Za-z]{3}" maxLength={3}
            defaultValue={position?.currency ?? "USD"} placeholder="USD" title="Three-letter currency code, e.g. USD or EUR" />
        </div>
        </div>
      </fieldset>

      <fieldset className="holding-form-section">
        <legend>Your entry</legend>
        <fieldset className="holding-direction">
          <legend>Direction</legend>
          <div className="holding-direction-options">
            <label>
              <input type="radio" name="side" value="buy" defaultChecked={!position || position.side === "buy"} />
              <span>Buy <small>/ Long</small></span>
            </label>
            <label>
              <input type="radio" name="side" value="sell" defaultChecked={position?.side === "sell"} />
              <span>Sell <small>/ Short</small></span>
            </label>
          </div>
        </fieldset>
        <div className="open-position-fields">
        <div>
          <label htmlFor={fieldId("quantity")}>Quantity</label>
          <input id={fieldId("quantity")} name="quantity" type="number" min="0" step="any" required
            defaultValue={position?.quantity ?? ""} placeholder="e.g. 10" />
        </div>
        <div>
          <label htmlFor={fieldId("entryPrice")}>Entry price</label>
          <input id={fieldId("entryPrice")} name="entryPrice" type="number" min="0" step="any" required
            defaultValue={position?.entryPrice ?? ""} placeholder="e.g. 150.00" />
          <small>What you paid per unit.</small>
        </div>
        <div className="holding-field-wide">
          <label htmlFor={fieldId("openDate")}>When did you open it?</label>
          <input id={fieldId("openDate")} name="openDate" type="date" required max={todayDate()}
            defaultValue={position?.openDate ?? todayDate()} />
        </div>
        </div>
      </fieldset>

      <details className="holding-extra" open>
        <summary>Market details</summary>
        <div className="open-position-fields">
          <div>
            <label htmlFor={fieldId("broker")}>Broker (optional)</label>
            <input id={fieldId("broker")} name="broker" maxLength={100}
              defaultValue={position?.broker ?? ""} placeholder="Your broker" />
          </div>
          <div>
            <label htmlFor={fieldId("exchange")}>Exchange</label>
            <input id={fieldId("exchange")} name="exchange" maxLength={100}
              defaultValue={position?.exchange ?? ""} placeholder="e.g. NASDAQ" />
            <small>Primary listing exchange: NASDAQ (XNAS), NYSE (XNYS), or Massive's four-character exchange code.</small>
          </div>
        </div>
      </details>
      {error && <p className="positions-error" role="alert">{error}</p>}
      <div className="open-position-actions">
        <button type="submit">{position ? "Save changes" : "Add to portfolio"}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
      <p className="holding-form-footnote">Saved on this device. You can edit these details anytime.</p>
    </form>
  );
}

export default OpenPositionForm;
