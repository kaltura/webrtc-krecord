<?php
function upload($client,$fileData,$title,$conv_profile=null,$type=null)
{
	try{
		$uploadToken = new KalturaUploadToken();
		$result = $client->uploadToken->add($uploadToken);
		$tok=$result->id;
		$resume = null;
		$finalChunk = null;
		$resumeAt = null;
		$result = $client->uploadToken->upload($tok, $fileData, $resume, $finalChunk, $resumeAt);
		$entry = new KalturaBaseEntry();
		$entry->name = $title;
		$entry->tags = 'Example';
		$entry->description = 'Example Entry Description';
		if (isset($conv_profile)){
			$entry->conversionProfileId = $conv_profile;	
		}
		if (!isset($type)){
			$type = KalturaEntryType::AUTOMATIC;
		}
		$result = $client->baseEntry->addfromuploadedfile($entry, $tok, $type);
		$id=$result->id;
		return($id);
	}catch(KalturaException $ex){
	    $message=$ex->getMessage();
    	    $error_code=$ex->getCode();
	    echo("Failed with message: $message, error code: $error_code\n");
	    exit(255);
        }
}
foreach(array('video', 'audio') as $type) {
        if (isset($_FILES["${type}-blob"])) {
	            $fileName = $_POST["${type}-filename"];
		    $uploadedFile = "uploads/$fileName";
		    if (!move_uploaded_file($_FILES["${type}-blob"]["tmp_name"], $uploadedFile)) {
			die("problem moving uploaded file");
		    }
	}
}
require_once(dirname(__FILE__).'/kaltura_php_client/KalturaClient.php');
$userId = null;
$expiry = null;
$privileges = null;
$type = KalturaSessionType::USER;
$config = new KalturaConfiguration();
$config->serviceUrl = $_POST['serviceUrl'];
$client = new KalturaClient($config);
$ks = $_POST['ks'];
$client->setKs($ks);
//$ext=explode(".",$uploadedFile);
$id=upload($client,$uploadedFile,basename($uploadedFile),null,null);
?>
