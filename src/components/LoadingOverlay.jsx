const LoadingOverlay = ({ isLoading, message = "Loading...", type = "default" }) => {
  if (!isLoading) return null;

  const iconMap = {
    default: "/heartbeat.gif",
    patients: "/patient.gif",
    appointments: "/person.gif",
    encounters: "/consultation.gif",
    prescriptions: "/medicine.gif",
    reports: "/report.gif",
    users: "/doctor.gif",
    billing: "/bill.gif",
    clinics: "/clinic.gif",
    payments: "/wallet.gif",
    inventory: "/medicine.gif",
    "my-profile": "/doctor.gif",
  };

  const icon = iconMap[type] || iconMap.default;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm">
        <img 
          src={icon} 
          alt="Loading" 
          className="w-20 h-20"
          style={{ filter: "drop-shadow(0 0 8px rgba(13, 148, 136, 0.6))" }}
          onError={(e) => { e.target.src = "/heartbeat.gif"; }}
        />
        <p className="text-gray-700 font-medium text-center">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
