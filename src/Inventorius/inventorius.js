import React, { useEffect, useState } from "react";
import "./inventorius.css";

function Inventorius() {
  const [items, setItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedDeletedId, setSelectedDeletedId] = useState(null);

  const selectedItem = items.find(i => i.id === selectedItemId) || null;
  const selectedDeletedItem = deletedItems.find(i => i.id === selectedDeletedId) || null;

  const [editData, setEditData] = useState({
    name: "",
    quantity: "",
    source: "prailgekai"
  });

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    source: "prailgekai"
  });

  const [activeTab, setActiveTab] = useState("inventorius");

  const Order = ["prailgekai", "garsas", "laidai", "irankiai"];

  // Load items and deleted items from backend
  useEffect(() => {
    async function loadAll() {
      try {
        const [itemsRes, deletedRes] = await Promise.all([
          fetch("http://localhost:4000/api/items"),
          fetch("http://localhost:4000/api/items/deleted")
        ]);
        const [itemsData, deletedData] = await Promise.all([
          itemsRes.ok ? itemsRes.json() : [],
          deletedRes.ok ? deletedRes.json() : [],
        ]);
        setItems(itemsData);
        setDeletedItems(deletedData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // Normal add/edit logic as before, but for delete use soft-delete endpoint
  async function saveEdit() {
    if (!selectedItem) return;
    try {
      const response = await fetch("http://localhost:4000/api/items/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          name: editData.name,
          quantity: editData.quantity,
          source: editData.source
        })
      });

      if (!response.ok) {
        alert("Update failed");
        return;
      }
      const updated = await response.json();
      setItems(items.map(i => (i.id === updated.id ? updated : i)));
      setSelectedItemId(null);
    } catch (err) {
      console.error(err);
      alert("Update failed (network error)");
    }
  }

  async function addItem() {
    try {
      const response = await fetch("http://localhost:4000/api/items/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      if (!response.ok) {
        alert("Add failed");
        return;
      }
      const created = await response.json();
      setItems([...items, created]);
      setNewItem({ name: "", quantity: "", source: "prailgekai" });
      setShowAddPanel(false);
    } catch (err) {
      console.error(err);
      alert("Add failed (network error)");
    }
  }

  // Soft delete: move to deleted items in backend
  async function deleteItem() {
    if (!selectedItem) return;
    try {
      const response = await fetch("http://localhost:4000/api/items/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedItem.id })
      });
      if (!response.ok) {
        alert("Delete failed");
        return;
      }
      setItems(items.filter(i => i.id !== selectedItem.id));
      // After a delete, reload deleted items
      const deletedRes = await fetch("http://localhost:4000/api/items/deleted");
      if (deletedRes.ok) {
        setDeletedItems(await deletedRes.json());
      }
      setSelectedItemId(null);
    } catch (err) {
      console.error(err);
      alert("Delete failed (network error)");
    }
  }

  // Restore deleted item
  async function restoreDeletedItem() {
    if (!selectedDeletedItem) return;
    try {
      const response = await fetch("http://localhost:4000/api/items/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedDeletedItem.id })
      });
      if (!response.ok) {
        alert("Restore failed");
        return;
      }
      // Reload both lists
      const [itemsRes, deletedRes] = await Promise.all([
        fetch("http://localhost:4000/api/items"),
        fetch("http://localhost:4000/api/items/deleted")
      ]);
      setItems(itemsRes.ok ? await itemsRes.json() : []);
      setDeletedItems(deletedRes.ok ? await deletedRes.json() : []);
      setSelectedDeletedId(null);
    } catch (err) {
      console.error(err);
      alert("Restore failed (network error)");
    }
  }

  // Permanently delete
  async function hardDeleteItem() {
    if (!selectedDeletedItem) return;
    try {
      const response = await fetch("http://localhost:4000/api/items/hard-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedDeletedItem.id })
      });
      if (!response.ok) {
        alert("Permanent delete failed");
        return;
      }
      setDeletedItems(deletedItems.filter(i => i.id !== selectedDeletedItem.id));
      setSelectedDeletedId(null);
    } catch (err) {
      console.error(err);
      alert("Permanent delete failed");
    }
  }

  if (loading) return <p>Loading items...</p>;

  return (
    <div className="inventorius-page">
      <div className="inventorius-card">
        <div className="header-row">
          <h1 className="page-title">InfoSA Inventorius</h1>
          <div className="tabs-row">
            <button
              className={activeTab === "inventorius" ? "tab-button tab-button-active" : "tab-button"}
              onClick={() => setActiveTab("inventorius")}
            >
              Turimas inventorius
            </button>
            <button
              className={activeTab === "deleted" ? "tab-button tab-button-active" : "tab-button"}
              onClick={() => setActiveTab("deleted")}
            >
              Ištrinti daiktai
            </button>
          </div>
        </div>

        {activeTab === "inventorius" && (
          <>
            <div className="button-row">
              <button
                className="btn primary"
                onClick={() => {
                  setShowAddPanel(true);
                  setSelectedItemId(null);
                }}
              >
                Pridėti naują daiktą
              </button>

              <button
                className="btn danger"
                disabled={!selectedItem}
                onClick={deleteItem}
              >
                Ištrinti pasirinktą daiktą
              </button>
            </div>

            <h2 className="section-title">Inventorius</h2>

            {!showAddPanel && (
              <table className="inventorius-table">
                <thead>
                  <tr>
                    <th>Daiktas</th>
                    <th>Kiekis</th>
                    <th className="select-col">Pasirinkti</th>
                  </tr>
                </thead>
                <tbody>
                  {[...items]
                    .sort((a, b) => Order.indexOf(a.source) - Order.indexOf(b.source))
                    .filter(item => selectedItemId ? item.id === selectedItemId : true)
                    .map(item => (
                      <tr
                        key={item.id}
                        className={item.id === selectedItemId ? "selected-row" : ""}
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setShowAddPanel(false);
                          setEditData({
                            name: item.name,
                            quantity: item.quantity,
                            source: item.source
                          });
                        }}
                      >
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td className="radio-cell">
                          <input
                            type="radio"
                            checked={item.id === selectedItemId}
                            readOnly
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {selectedItem && !showAddPanel && (
              <div className="panel edit-panel">
                <h3>Readaguoti pasirinktą daiktą</h3>
                <div className="panel-grid">
                  <label>
                    Daiktas
                    <input
                      value={editData.name}
                      onChange={e =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Kiekis
                    <input
                      type="number"
                      value={editData.quantity}
                      onChange={e =>
                        setEditData({ ...editData, quantity: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Kategorija
                    <select
                      value={editData.source}
                      onChange={e =>
                        setEditData({ ...editData, source: e.target.value })
                      }
                    >
                      <option value="prailgekai">prailgekai</option>
                      <option value="garsas">Garsas</option>
                      <option value="laidai">Laidai</option>
                      <option value="irankiai">Įrankiai</option>
                    </select>
                  </label>
                </div>
                <div className="panel-actions">
                  <button className="btn primary" onClick={saveEdit}>
                    Išsaugoti
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setSelectedItemId(null)}
                  >
                    Atšaukti
                  </button>
                </div>
              </div>
            )}

            {showAddPanel && (
              <div className="panel add-panel">
                <h3>Pridėti naują daiktą</h3>
                <div className="panel-grid">
                  <label>
                    Daiktas
                    <input
                      placeholder="Item name"
                      value={newItem.name}
                      onChange={e =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Kiekis
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={newItem.quantity}
                      onChange={e =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Kategorija
                    <select
                      value={newItem.source}
                      onChange={e =>
                        setNewItem({ ...newItem, source: e.target.value })
                      }
                    >
                      <option value="prailgekai">prailgekai</option>
                      <option value="garsas">Garsas</option>
                      <option value="laidai">Laidai</option>
                      <option value="irankiai">Įrankiai</option>
                    </select>
                  </label>
                </div>
                <div className="panel-actions">
                  <button className="btn primary" onClick={addItem}>
                    Pridėti daiktą
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setShowAddPanel(false)}
                  >
                    Atšaukti
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "deleted" && (
          <div className="panel removed-panel">
            <h2 className="section-title">Ištrinti daiktai</h2>
            {deletedItems.length === 0 ? (
              <p>Šiuo metu nėra ištrintų daiktų.</p>
            ) : (
              <table className="inventorius-table">
                <thead>
                  <tr>
                    <th>Daiktas</th>
                    <th>Kiekis</th>
                    <th>Ištrinta</th>
                    <th>Veiksmas</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedItems.map(item => (
                    <tr
                      key={item.id}
                      className={item.id === selectedDeletedId ? "selected-row" : ""}
                      onClick={() => setSelectedDeletedId(item.id)}
                    >
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.deletedAt ? new Date(item.deletedAt).toLocaleString() : ""}</td>
                      <td>
                        <button className="btn" onClick={restoreDeletedItem}>
                          Atstatyti
                        </button>
                        <button className="btn danger" onClick={hardDeleteItem}>
                          Pašalinti visam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="info-text">
              Ištrinti daiktai saugomi 30 dienų nuo ištrynimo datos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventorius;
