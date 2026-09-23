const {normalizeEvidence}=require("./evidence");
async function rdap(domain){return {connector:"rdap",status:"simulated",domain,evidence:[]};}
async function market(domain){return {connector:"market",status:"simulated",domain,evidence:[]};}
async function news(domain){return {connector:"news",status:"simulated",domain,evidence:[]};}
async function buyer(domain){return {connector:"buyer",status:"simulated",domain,evidence:[]};}
module.exports={rdap,market,news,buyer};
