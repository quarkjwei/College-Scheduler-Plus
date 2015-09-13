chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		//URL Query Strings
		var urlParams;
	    var match,
	        pl     = /\+/g,  // Regex for replacing addition symbol with a space
	        search = /([^&=]+)=?([^&]*)/g,
	        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	        query  = window.location.search.substring(1);
	    urlParams = {};
		// console.log(parent);
	    while (match = search.exec(query))
	       urlParams[decode(match[1])] = decode(match[2]);

		if(urlParams.close!==undefined){
			parent.closeIFrame();
		}
		console.log(urlParams);
		//General storage.
		var dataStorage = {};
		if(localStorage.getItem("data")!==null){	//Get general storage object
			dataStorage = JSON.parse(localStorage.getItem("data"));
			// console.log(dataStorage);
		}
		var teacherData;
		var teachers;
		var cache = [];

		$("#reg").find("th").eq(5).after("<th>Rating</th>");
		var count = 0;
		$("#reg").find("tr[align='center']").each(function(){//Each row
			if($(this).find("td").first().find("input").prop("checked")){
				$(this).css("background-color", "#66EC66");
				count++;
			}
			var name = $(this).find("td").eq(5).text().split(",");
			var lname = name[0].split(" ")[0];
			var fname = name[1].split(" ")[1];

			//Search Cache
			search = null;
			cached = false;
			// console.log(cache);
			for(i = 0; i < cache.length; i++){
				if(cache[i].name == (fname + ' ' + lname)){	//Result is cached
					cached = true;
					search = [cache[i]];
					break;
				}
			}

			//Search Everything
			if(!cached){
				if(dataStorage.currentSchool !== undefined){
					teacherData = JSON.parse(localStorage.getItem(dataStorage.currentSchool));
					teachers = teacherData.teachers;
					if(teacherData.cache !== undefined)
						cache = teacherData.cache;
				}


				var searchString = '//*[name="' + fname + ' ' + lname + '"]';
				search = JSON.search(teachers, searchString);
				// console.log(search);
			}
			if(search.length){//If there is a match
				if(!cached){
					cache.push(search[0]);
				}
				$(this).find("td").eq(5).html("<a href='http://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + search[0].pk_id + "'>" + $(this).find("td").eq(5).html() + "</a>");
				$(this).find("td").eq(5).after("<td>" + search[0].averageratingscore_rf + "</td>");
				if(urlParams.rating!==undefined){
					if(search[0].averageratingscore_rf > urlParams.rating){
						$(this).find("td").first().find("input").prop("checked", true);
					}
					else{
						$(this).find("td").first().find("input").prop("checked", false);
					}
				}
			}
			else{
				$(this).find("td").eq(5).after("<td>N/A</td>");
				if(urlParams.rating!==undefined&&urlParams.rating>0)
					$(this).find("td").first().find("input").prop("checked", false);
			}
		});
		console.log(dataStorage[urlParams.term][urlParams.subject + urlParams.courseno]);
		console.log(urlParams.subject + urlParams.courseno);
		$("#pnlOptionInstructions").append("<span></br>" + count + " classes have teachers who meet the " + dataStorage[urlParams.term][urlParams.subject + urlParams.courseno] +  " rating threshold</span>");
		// console.log(urlParams);
		//Save cache
		localStorage.setItem("cache", JSON.stringify(cache));
		localStorage.setItem("data", JSON.stringify(dataStorage));
		if(urlParams.rating!==undefined){
			$("form").attr("action", $("form").attr("action") + "&close=true");
			$("[name='btnBottomSave']").click();
		}
		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		// console.log("Hello. This message was sent from scripts/inject.js");
		// ----------------------------------------------------------
	}
	}, 10);
});

function binarySearch(array, property, value){
	var searchIndex = array.length/2;
	searchIndex = Math.floor(searchIndex);
	// console.log(array[searchIndex][property]);
	if(value == array[searchIndex][property]){
		return searchIndex;
	}
	else if(value > array[searchIndex][property]){
		binarySearch(array.slice(searchIndex,array.length), property, value);
	}
	else{
		binarySearch(array.slice(0,searchIndex), property, value);
	}
}
