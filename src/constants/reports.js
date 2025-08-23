export const REPORT_TYPES = {
  TOPUP: "topup",
  DATA: "data",
  STOCK_TRANSFER: "stock_transfer",
  STOCK_REVERSE: "stock_reverse",
  ROLLBACK: "rollback",
  DOWNLINE: "downline",
};

export const DUMMY_REPORTS = {
  [REPORT_TYPES.TOPUP]: [
    {
      id: "t1",
      date: "2024-02-23 19:32",
      msisdn: "(+93)700900900",
      operator: "AWCC",
      amountAFN: 200,
      amountUSD: 1.3,
      ref: "#TP98765",
    },
    {
      id: "t2",
      date: "2024-02-23 18:04",
      msisdn: "(+93)787710623",
      operator: "Roshan",
      amountAFN: 500,
      amountUSD: 3.3,
      ref: "#TP98712",
    },
  ],
  [REPORT_TYPES.DATA]: [
    {
      id: "d1",
      date: "2024-02-23 16:11",
      msisdn: "(+93)700900900",
      plan: "30GB / 30 days",
      amountAFN: 1200,
      amountUSD: 8.0,
      ref: "#DB56431",
    },
    {
      id: "d2",
      date: "2024-02-22 14:45",
      msisdn: "(+93)787710623",
      plan: "5GB / 7 days",
      amountAFN: 250,
      amountUSD: 1.7,
      ref: "#DB56310",
    },
  ],
  [REPORT_TYPES.STOCK_TRANSFER]: [
    {
      id: "s1",
      date: "2024-02-23 12:22",
      to: "Ahmad (+93787710222)",
      amountAFN: 100000,
      commissionPct: 3,
      totalAFN: 103000,
      ref: "#ST10001",
    },
    {
      id: "s2",
      date: "2024-02-21 10:05",
      to: "Zahra (+93700111222)",
      amountAFN: 50000,
      commissionPct: 2,
      totalAFN: 51000,
      ref: "#ST09990",
    },
  ],
  [REPORT_TYPES.STOCK_REVERSE]: [
    {
      id: "r1",
      date: "2024-02-23 13:05",
      agent: "Ahmad (+93787710222)",
      amountAFN: 50000,
      reason: "Wrong amount",
      ref: "#SR44521",
    },
  ],
  [REPORT_TYPES.ROLLBACK]: [
    {
      id: "rb1",
      date: "2024-02-20 09:20",
      msisdn: "(+93)700900900",
      service: "Topup",
      amountAFN: 200,
      status: "Rolled back",
      ref: "#RB22110",
    },
  ],
  [REPORT_TYPES.DOWNLINE]: [
    {
      id: "dl1",
      date: "2024-02-21 11:10",
      agent: "Hamid • Agent ID 102",
      txn: "Topup",
      valueAFN: 1000,
      commissionAFN: 30,
      ref: "#DL55010",
    },
    {
      id: "dl2",
      date: "2024-02-21 12:40",
      agent: "Hamid • Agent ID 102",
      txn: "Data",
      valueAFN: 1200,
      commissionAFN: 36,
      ref: "#DL55011",
    },
  ],
};

export const REPORT_META = {
  [REPORT_TYPES.TOPUP]: {
    title: "Topup Report",
    icon: "phone-portrait-outline",
  },
  [REPORT_TYPES.DATA]: { title: "Data Report", icon: "wifi-outline" },
  [REPORT_TYPES.STOCK_TRANSFER]: {
    title: "Stock Transfer Report",
    icon: "swap-horizontal-outline",
  },
  [REPORT_TYPES.STOCK_REVERSE]: {
    title: "Stock Reverse Report",
    icon: "reload-outline",
  },
  [REPORT_TYPES.ROLLBACK]: {
    title: "Rollback Report",
    icon: "arrow-undo-outline",
  },
  [REPORT_TYPES.DOWNLINE]: { title: "Downline Report", icon: "people-outline" },
};
