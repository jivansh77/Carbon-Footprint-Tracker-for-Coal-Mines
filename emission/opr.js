const qty = document.querySelector("#qty");
const type = document.querySelector("#type");
const btn = document.querySelector("#subButton");
const result = document.querySelector("#resultBox");
const selectedState = document.querySelector("#selectedState");
const selectedDistrict = document.querySelector("#selectedDistrict");
const places = require("./data/india-places");

for(let p of places.states) 
    { 
        let option = document.createElement("option"); 
        selectedState.append(option); 
        option.innerText = `${p.name}`; 
    } 

btn.addEventListener("click",() => {
    let emission = calc(qty.value,type.value);
    result.innerText = `C02 emission: ${emission}kg`;
    console.log("clicked");
})

function calc(qty,type)
{
    let pct;
    if(type === 'Bituminous')
    {
        pct = 70;
    }
    else if(type === 'Anthracite')
    {
        pct = 90;
    }
    let netCarb = (pct/100)*qty;
    return (netCarb)*3.67;
}