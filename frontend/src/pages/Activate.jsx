import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";

export default function Activate() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    const activate = async () => {
      try {
        const res = await api.get(`/user/activate/${uid}/${token}/`);
        const text =
          res.data.message ||
          (typeof res.data.detail === "string" &&
          res.data.detail.toLowerCase().includes("active")
            ? res.data.detail
            : null) ||
          "Account activated successfully!";
        setMessage(text);
        setStatus("success");
        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        setMessage(
          err.response?.data?.detail ||
            "Activation failed. The link may be invalid or already used."
        );
        setStatus("error");
      }
    };

    activate();
  }, [uid, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center">
        <div className="h-12 w-12 rounded-2xl bg-black text-white grid place-items-center font-bold text-lg mx-auto mb-4">
          CR
        </div>
        <h1 className="text-xl font-extrabold mb-2">Account Activation</h1>

        {status === "loading" && (
          <p className="text-gray-500">Verifying your activation link…</p>
        )}

        {status === "success" && (
          <>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {message}
            </div>
            <p className="text-sm text-gray-400 mt-3">Redirecting you to login in 3 seconds…</p>
            <Link to="/login" className="mt-4 inline-block text-sm underline text-gray-600">
              Go to Login now
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {message}
            </div>
            <Link to="/login" className="mt-4 inline-block text-sm underline text-gray-600">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
