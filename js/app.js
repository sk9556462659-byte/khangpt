function setPrompt(text){
document.getElementById("prompt").value=text;
}

async function generate(){

const prompt=document.getElementById("prompt").value;

if(!prompt){
alert("Enter prompt");
return;
}

document.getElementById("result").innerHTML="Generating...";

const res=await fetch("/api/generate",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({prompt})
});

const data=await res.json();

document.getElementById("result").innerHTML=
'<img src="'+data.url+'">';
}