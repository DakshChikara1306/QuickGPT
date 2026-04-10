import React, { useEffect } from "react";
import toast from "react-hot-toast";

// 🔹 Components
import Loading from "./Loading";

// 🔹 Context
import { useAppContext } from "../context/AppContext";

// 🔹 Assets (unused but kept as per your rule)
import { dummyPlans } from "../assets/assets";

const Credits = () => {
  // 🔹 Local state
  const [plans, setPlans] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 🔹 Context
  const { axios, token } = useAppContext();

  // =========================================================
  // 📥 Fetch available credit plans
  // =========================================================
  const fetchPlans = async () => {
    try {
      const { data } = await axios.get("/api/credit/plan", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setPlans(data.plans);
      } else {
        toast.error(data.message || "Failed to fetch plans");
      }
    } catch (err) {
      toast.error(err.message || "Failed to fetch plans");
    }

    setLoading(false);
  };

  // =========================================================
  // 💳 Purchase selected plan
  // Redirects user to payment URL
  // =========================================================
  const purchasePlan = async (planId) => {
    try {
      const { data } = await axios.post(
        "/api/credit/purchase",
        { planId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Failed to purchase plan");
      }
    } catch (err) {
      toast.error(err.message || "Failed to purchase plan");
    }
  };

  // =========================================================
  // 🔁 Fetch plans on component mount
  // =========================================================
  useEffect(() => {
    fetchPlans();
  }, []);

  // ⏳ Show loader while fetching
  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl h-screen overflow-y-scroll mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* 🧾 Heading */}
      <h2 className="text-3xl font-semibold text-center mb-10 xl:mt-30 text-gray-800 dark:text-white">
        Credit Plans
      </h2>

      {/* 📦 Plans Grid */}
      <div className="flex flex-wrap justify-center gap-8">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`border border-gray-200 dark:border-purple-700 rounded-lg shadow hover:shadow-lg transition-shadow p-6 min-w-75 flex flex-col ${
              plan._id === "pro"
                ? "bg-purple-50 dark:bg-purple-900"
                : "bg-white dark:bg-transparent"
            }`}
          >
            <div className="flex-1">
              
              {/* 📌 Plan Name */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>

              {/* 💰 Pricing */}
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-300 mb-4">
                ${plan.price}
                <span className="text-base font-normal text-gray-600 dark:text-purple-200">
                  {" "}
                  / {plan.credits} credits
                </span>
              </p>

              {/* 📋 Features */}
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-purple-200 space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            {/* 🛒 Purchase Button */}
            <button
              onClick={() =>
                toast.promise(purchasePlan(plan._id), {
                  loading: "Processing...",
                })
              }
              className="mt-6 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-medium py-2 rounded transition-colors cursor-pointer"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Credits;