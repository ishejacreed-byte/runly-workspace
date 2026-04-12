export function formatBudget(value) { 

  const number = Number(value); 

  if (Number.isNaN(number)) return value; 

  return number.toFixed(2); 

} 

  

export function formatDate(dateString) { 

  if (!dateString) return "Unknown"; 

  const date = new Date(dateString); 

  if (Number.isNaN(date.getTime())) return "Unknown"; 

  return date.toLocaleString(); 

} 

  

export function formatCompactDate(dateString) { 

  if (!dateString) return "Unknown"; 

  const date = new Date(dateString); 

  if (Number.isNaN(date.getTime())) return "Unknown"; 

  

  return date.toLocaleString([], { 

    month: "short", 

    day: "numeric", 

    hour: "numeric", 

    minute: "2-digit", 

  }); 

} 

  

export function formatShortDate(dateString) { 

  if (!dateString) return ""; 

  const date = new Date(dateString); 

  if (Number.isNaN(date.getTime())) return ""; 

  return date.toLocaleString([], { 

    month: "short", 

    day: "numeric", 

  }); 

} 

  

export function formatChatTime(dateString) { 

  if (!dateString) return ""; 

  const date = new Date(dateString); 

  if (Number.isNaN(date.getTime())) return ""; 

  return date.toLocaleString([], { 

    month: "short", 

    day: "numeric", 

    hour: "numeric", 

    minute: "2-digit", 

  }); 

} 

  

export function formatUrgencyLabel(urgency) { 

  if (!urgency) return "ASAP"; 

  if (urgency === "within_1_hour") return "Within 1 hour"; 

  if (urgency === "scheduled") return "Scheduled"; 

  return "ASAP"; 

} 

  

export function formatSystemRoleLabel(systemRole) { 

  if (!systemRole) return "User"; 

  return systemRole.charAt(0).toUpperCase() + systemRole.slice(1); 

} 

  

export function formatAdminTabLabel(tab) { 

  if (tab === "verifications") return "Verifications"; 

  if (tab === "reports") return "Reports"; 

  return "Users"; 

} 

  

export function formatAdminFilterLabel(filter) { 

  if (filter === "pending") return "Pending"; 

  if (filter === "verified") return "Verified"; 

  if (filter === "rejected") return "Rejected"; 

  if (filter === "open") return "Open"; 

  if (filter === "reviewed") return "Reviewed"; 

  if (filter === "closed") return "Closed"; 

  if (filter === "admins") return "Admins"; 

  if (filter === "developers") return "Developers"; 

  if (filter === "banned") return "Banned"; 

  return "All"; 

} 

  

export function getStatusLabel(status) { 

  if (!status) return "open"; 

  return status.replaceAll("_", " "); 

} 