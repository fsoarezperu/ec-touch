
var response = '01F0EE0102';
var poll_responde=response.match(/.{1,2}/g);

if(poll_responde[1] == "F0"){
  console.log("OK received");
for (var i =1; i< poll_responde.length; i++ )
{
  switch(poll_responde[i])
  {
    case("E8"):
    //execute here if value detected
    console.log("Validator disabled");
    break;

    case("EE"):
    {
      console.log("CREDIT NOTE");
      var credit=poll_responde[i+1];
      console.log(credit);
      i++;
      credit=poll_responde[i+1];
      console.log(credit);
      break;
    }

  }//switch closing
}//end of FOR loop
}//end iff
