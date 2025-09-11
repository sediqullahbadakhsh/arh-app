import api from "./apiClient";


export const getCountries = ()=>{
  return api.get('/country?lang=en').then((r)=>r.data)
}
export const makeRecharge = (payload = {})=>{
  
  return api.post(`/orders/customer?lang=en`,payload).then((r)=>r.data)
}


export const getCurrencies = ()=>{
  return api.get('/exchangeRates/customer').then((r)=>r.data)
}
export const getSlabs= ()=>{
  return api.get('/slabs/customer').then((r)=>r.data)
}



