<?php
require 'secured_information.php';

$connectionx = mysqli_connect($servername, $username, $password,$database);
if (!$connectionx) { die("Connection failed: " . mysqli_connect_error());}

function ejecutar($sql){
$conn=$GLOBALS['connectionx'];
     $result=mysqli_query($conn,$sql)or die();
      return $result;
//      mysqli_close($conn);
  }

function contar($sql){
  $conn=$GLOBALS['connectionx'];
  $result=mysqli_query($conn,$sql)or die();
  $rowcount=mysqli_num_rows($result);
  //printf("Result set has %d rows.\n",$rowcount);
  return $rowcount;
//  mysqli_close($conn);
}
//MYSQLI_ASSOC  or MYSQLI_NUM
function cargar_objeto($sql,$optional=''){

if($optional!=''){
  $fetch=mysqli_fetch_array($sql,$optional);
}else {
  $fetch=mysqli_fetch_array($sql);
}
  return $fetch;
}
//mysqli_close($connectionx);
?>
