import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "₹";
  const delivery_fee = 0;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  };

  const applyCoupon = (code) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === "BUFFY10") {
      setCoupon(trimmed);
      setDiscount(0.10);
      toast.success("Coupon applied successfully!");
      return { success: true };
    } else {
      setCoupon("");
      setDiscount(0);
      toast.error("Invalid coupon code");
      return { success: false };
    }
  };

  const getDiscountAmount = () => getCartAmount() * discount;

  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Select Product Size");
      return;
    }

    const newCart = structuredClone(cartItems);
    if (!newCart[itemId]) newCart[itemId] = {};
    newCart[itemId][size] = (newCart[itemId][size] || 0) + 1;
    setCartItems(newCart);

    if (token) {
      try {
        await axios.post(
          `${backendUrl}/api/cart/add`,
          { itemId, size },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.log(err);
        toast.error("Failed to sync cart");
      }
    }
  };

  const updateQuantity = async (itemId, size, quantity) => {
    const updatedCart = structuredClone(cartItems);
    if (updatedCart[itemId]) {
      updatedCart[itemId][size] = quantity;
      setCartItems(updatedCart);

      if (token) {
        try {
          await axios.post(
            `${backendUrl}/api/cart/update`,
            { itemId, size, quantity },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.log(err);
          toast.error("Update failed");
        }
      }
    }
  };

  const getCartCount = () => {
    let count = 0;
    for (let item in cartItems) {
      for (let size in cartItems[item]) {
        count += cartItems[item][size];
      }
    }
    return count;
  };

  const getCartAmount = () => {
    let amount = 0;
    for (let item in cartItems) {
      const product = products.find((p) => p._id === item);
      if (!product) continue;
      for (let size in cartItems[item]) {
        amount += product.price * cartItems[item][size];
      }
    }
    return amount;
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/product/list`);
      if (res.data.success) {
        setProducts(res.data.products);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to load products");
    }
  };

  const fetchUserCart = async () => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/cart/get`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setCartItems(res.data.cartData);
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to load cart");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) {
      setToken(savedToken);
      const userData = savedUser ? JSON.parse(savedUser) : decodeToken(savedToken);
      if (userData) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserCart();
    }
  }, [token]);

  const contextValue = {
    products,
    currency,
    delivery_fee,
    backendUrl,

    search,
    setSearch,
    showSearch,
    setShowSearch,

    cartItems,
    setCartItems,
    addToCart,
    updateQuantity,
    getCartCount,
    getCartAmount,

    token,
    setToken,
    user,
    setUser,
    navigate,

    coupon,
    discount,
    applyCoupon,
    getDiscountAmount,
    setCoupon,
    setDiscount,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
