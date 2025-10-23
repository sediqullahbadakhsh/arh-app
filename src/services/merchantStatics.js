import api from './apiClient';

export const revenueStatsForMerchant = (params = {}) => {
  return api.get('/statistics/merchant-revenueStatsForMerchant', { params })
    .then((r) => r.data);
};

export const countDownlineAgents = (params = {}) => {
  return api.get('/statistics/merchant-countDownlineAgents', { params })
    .then((r) => r.data);
};

export const countStockPurchaseStats = (params = {}) => {
  return api.get('/statistics/merchant-countStockPurchaseStats', { params })
    .then((r) => r.data);
};

export const stockTransferStats = (params = {}) => {
  return api.get('/statistics/merchant-stockTransferStats', { params })
    .then((r) => r.data);
};

export const getMerchantRechargeLogStats = (params = {}) => {
  return api.get('/statistics/merchant-getMerchantRechargeLogStats', { params })
    .then((r) => r.data);
};

export const getProductActivationLogStats = (params = {}) => {
  return api.get('/statistics/merchant-getProductActivationLogStats', { params })
    .then((r) => r.data);
};

export const getMerchantReverseStockStats = (params = {}) => {
  return api.get('/statistics/merchant-getMerchantReverseStockStats', { params })
    .then((r) => r.data);
};

export const getMerchantTicketStats = (params = {}) => {
  return api.get('/statistics/merchant-getMerchantTicketStats', { params })
    .then((r) => r.data);
};