import { useEffect, useState } from "react";
import api from "./api/axios";
import { jwtDecode } from "jwt-decode";

/* ============================
   TYPES
============================ */
type Sweet = {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

type TokenPayload = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
};

function App() {
  /* ============================
     AUTH
  ============================ */
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isAdmin = token
    ? jwtDecode<TokenPayload>(token).role === "ADMIN"
    : false;

  /* ============================
     STATE
  ============================ */
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [cart, setCart] = useState<Sweet[]>([]);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  /* ============================
     ADMIN FORM
  ============================ */
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  /* ============================
     FETCH SWEETS
  ============================ */
  useEffect(() => {
    if (!token) return;

    api
      .get("/api/sweets")
      .then((res) => setSweets(res.data))
      .catch(() => setError("Failed to load sweets"));
  }, [token]);

  /* ============================
     AUTH ACTIONS
  ============================ */
  const handleLogin = () => {
    api
      .post("/api/auth/login", { username, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
      })
      .catch(() => alert("Invalid credentials"));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCart([]);
  };

  /* ============================
     ADMIN: ADD SWEET
  ============================ */
  const handleAddSweet = () => {
    api
      .post("/api/sweets", {
        name,
        category,
        price: Number(price),
        quantity: Number(quantity),
        imageUrl,
      })
      .then((res) => {
        setSweets([...sweets, res.data]);
        setName("");
        setCategory("");
        setPrice("");
        setQuantity("");
        setImageUrl("");
      })
      .catch(() => alert("Failed to add sweet"));
  };

  /* ============================
     CART LOGIC
  ============================ */
  const addToCart = (sweet: Sweet) => {
    api.post(`/api/sweets/${sweet.id}/purchase`).then((res) => {
      setSweets(sweets.map((s) => (s.id === sweet.id ? res.data : s)));
    });

    const exists = cart.find((item) => item.id === sweet.id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === sweet.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...sweet, quantity: 1 }]);
    }
  };

  const filteredSweets = sweets.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "ALL" || s.category === filter)
  );

  /* ============================
     LOGIN UI
  ============================ */
  if (!token) {
    return (
      <div className="login-container">
        <h2>🍬 Sweet Shop Login</h2>
        <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  /* ============================
     MAIN UI
  ============================ */
  return (
    <div className="app">
      <header>
        <h1>🍭 Sweet Shop</h1>
        <input
          placeholder="Search sweets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="MILK">Milk</option>
          <option value="DRY">Dry</option>
        </select>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {/* CART */}
      <div className="cart">
        <h3>🛒 Cart ({cart.length})</h3>
        {cart.map((item) => (
          <div className="cart-item" key={item.id}>
            <span>{item.name}</span>
            <span>₹{item.price}</span>
          </div>
        ))}
        {cart.length > 0 && (
          <>
            <h4>Total ₹{cart.reduce((s, i) => s + i.price, 0)}</h4>
            <button onClick={() => setCart([])}>Checkout</button>
          </>
        )}
      </div>

      {/* ADMIN */}
      {isAdmin && (
        <div className="admin-form">
          <h3>Add Sweet (Admin)</h3>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
          <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <button onClick={handleAddSweet}>Add Sweet</button>
        </div>
      )}

      {/* SWEET GRID */}
      <div className="grid">
        {filteredSweets.map((sweet) => (
          <div className="card" key={sweet.id}>
            <img src={sweet.imageUrl} alt={sweet.name} />
            <h3>{sweet.name}</h3>
            <p>{sweet.category}</p>
            <p className="price">₹{sweet.price}</p>
            <button
              disabled={sweet.quantity === 0}
              onClick={() => addToCart(sweet)}
            >
              {sweet.quantity === 0 ? "Out of Stock" : "Buy"}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default App;
