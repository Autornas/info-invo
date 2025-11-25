import React, { useEffect, useState } from "react";
import "./inventorius.css";

function Inventorius() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [editData, setEditData] = useState({ name: "", quantity: "" });

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    source: "prailgekai"
  });

  const Order = ["prailgekai", "garsas", "laidai", "irankiai"];

  // Load items
  useEffect(() => {
    async function loadItems() {
      const response = await fetch("http://localhost:4000/api/items");
      const data = await response.json();
      setItems(data);
      setLoading(false);
    }
    loadItems();
  }, []);

  // Save edited item
  async function saveEdit() {
    if (!selectedItem) return;

    const response = await fetch("http://localhost:4000/api/items/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldName: selectedItem.name,
        newName: editData.name,
        quantity: editData.quantity,
        source: selectedItem.source,
        colName: selectedItem.colName
      }),
    });

    if (!response.ok) {
      alert("Update failed");
      return;
    }

    setItems(items.map(i =>
      i.name === selectedItem.name && i.source === selectedItem.source
        ? { ...i, name: editData.name, quantity: editData.quantity }
        : i
    ));

    setSelectedItem(null);
  }

  // Add new item
  async function addItem() {
    const response = await fetch("http://localhost:4000/api/items/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem)
    });

    if (!response.ok) {
      alert("Add failed");
      return;
    }

    setItems([...items, newItem]); 
    setNewItem({ name: "", quantity: "", source: "prailgekai" });
    setShowAddPanel(false);
  }

  // Delete selected item
  async function deleteItem() {
    if (!selectedItem) return;

    const response = await fetch("http://localhost:4000/api/items/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selectedItem.name,
        source: selectedItem.source
      })
    });

    if (!response.ok) {
      alert("Delete failed");
      return;
    }

    setItems(items.filter(i =>
      !(i.name === selectedItem.name && i.source === selectedItem.source)
    ));

    setSelectedItem(null);
  }

  if (loading) return <p>Loading items...</p>;

  return (
    <div className="inventorius-container">
      <h1>Inventorius Page</h1>

      {/* BUTTONS */}
      <div className="button-row">
        <button onClick={() => setShowAddPanel(true)}>Add New Item</button>

        <button
          disabled={!selectedItem}
          onClick={deleteItem}
          style={{ marginLeft: "10px" }}
        >
          Delete Selected Item
        </button>
      </div>

      {/* TABLE */}
      <table className="inventorius-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>Item name</th>
            <th>Quantity</th>
          </tr>
        </thead>

        <tbody>
          {[...items]
            .sort((a, b) => Order.indexOf(a.source) - Order.indexOf(b.source))
            .map(item => (
              <tr
                key={`${item.source}-${item.name}`}
                className={
                  selectedItem?.name === item.name &&
                  selectedItem?.source === item.source
                    ? "selected-row"
                    : ""
                }
                onClick={() => {
                  setSelectedItem(item);
                  setEditData({
                    name: item.name,
                    quantity: item.quantity
                  });
                }}
              >
                <td>
                  <input
                    type="radio"
                    checked={selectedItem?.name === item.name}
                    readOnly
                  />
                </td>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* EDIT PANEL */}
      {selectedItem && (
        <div className="edit-panel">
          <h3>Edit selected item</h3>

          <input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />

          <input
            type="number"
            value={editData.quantity}
            onChange={(e) =>
              setEditData({ ...editData, quantity: e.target.value })
            }
          />

          <button onClick={saveEdit}>Save Changes</button>
        </div>
      )}

      {/* ADD PANEL */}
      {showAddPanel && (
        <div className="add-panel">
          <h3>Add New Item</h3>

          <input
            placeholder="Item name"
            value={newItem.name}
            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
          />

          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
          />

          <select
            value={newItem.source}
            onChange={e => setNewItem({ ...newItem, source: e.target.value })}
          >
            <option value="prailgekai">prailgekai</option>
            <option value="garsas">Garsas</option>
            <option value="laidai">Laidai</option>
            <option value="irankiai">Įrankiai</option>
          </select>

          <button onClick={addItem}>Add Item</button>
        </div>
      )}
    </div>
  );
}

export default Inventorius;
