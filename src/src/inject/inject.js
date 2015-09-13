iframecounter = 0;
chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
		//Some stupid div
		$("body").append("<div id='iframes'></div>");

		//General storage.
		var dataStorage = {};
		if(localStorage.getItem("data")!==null){	//Get general storage object
			dataStorage = JSON.parse(localStorage.getItem("data"));
			console.log(dataStorage);
		}

		// dataStorage = {};//Force clear cache


		var term = $("[name='ddlTerm']").val();
		if(dataStorage[term]===undefined){//If the term isn't already in storage
			dataStorage[term] = {};
		}

		//School Picker
		$("#divFeedbackSpacer").after("<div><select id='school-picker'></select></div>");		//Create select element
		schoolPicker = $("#school-picker");
		var schoolAcronym = window.top.document.location.host.split('.')[0];		//Get school acronym from url
		schoolSearchURL = "http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows=10&q="
		+ schoolAcronym
		+ "&defType=edismax&bq=schoolname_sort_s:%22vcu%22^1000&qf=schoolname_autosuggest&bf=pow%28total_number_of_ratings_i,1.9%29&sort=score+desc&siteName=rmp&rows=20&group=off&group.field=content_type_s&group.limit=20&fq=content_type_s:SCHOOL";

		if(localStorage.getItem(schoolAcronym)==null){	//If the school search isn't in storage, search for school via schoolAcronym
			$.get(schoolSearchURL, function(data){
				var data = JSON.parse(data).response.docs;
				localStorage.setItem(schoolAcronym, JSON.stringify(data));
				for(i = 0; i < data.length; i++){
					schoolPicker.append("<option value='" + data[i].pk_id + "'>" + data[i].schoolname_s + ", " + data[i].schoolcity_s + ", " + data[i].schoolstate_s + "</option>");
				}
			});
		}
		else{
			var data = JSON.parse(localStorage.getItem(schoolAcronym));
			for(i = 0; i < data.length; i++){
				schoolPicker.append("<option value='" + data[i].pk_id + "'>" + data[i].schoolname_s + ", " + data[i].schoolcity_s + ", " + data[i].schoolstate_s + "</option>");
			}
		}
		var schoolID = $("#school-picker").val();
		dataStorage["currentSchool"] = schoolID;
		console.log()
		teacherData = null;
		if(localStorage.getItem(schoolID)!==null)
			teacherData = JSON.parse(localStorage.getItem(schoolID));
		if(teacherData === null || (new Date().getTime()- teacherData.time)/1000000 > 2628){//If teachers haven't been pulled for this school, or data is > a month old
			teacherData = {};
			teacherData.time = new Date().getTime();
			teacherData.teachers = getTeacherData(schoolID);
			var teachers = teacherData.teachers;
			for(i = 0; i < teachers.length; i++){
				teacherData.teachers[i].name = teachers[i].teacherfirstname_t + " " + teachers[i].teacherlastname_t;
				delete teacherData.teachers[i].teacherlastname_t;
				delete teacherData.teachers[i].teacherfirstname_t;
				delete teacherData.teachers[i].total_number_of_ratings_i;
			}
		}
		$("#school-picker").change(function(){
			schoolID = $(this).val();
		});

		//Add global controls
		$("#school-picker").parent().append("<h2>Global Controls</h2>")
		$("#school-picker").parent().append("<div class='global-controls'><div class='row'><div class='col-md-4' style='text-align: right'>Minimum Rating</div><div class='col-md-6'><input class='globalRatingSlider'></div></div></div>");
		var globalSlider = $(".globalRatingSlider").slider({
			min: 0,
			max: 5,
			value: 0,
			step: .1
		});
		var draggingGlobal = false;
		$(".globalRatingSlider").prev().mousedown(function(){
			draggingGlobal = true;
		});

		//Add columns to courses tables
		// $(".main-courses-grid").find("th").eq(3).after("<th>Classes/Teachers</br>Selected</th>");
		// $(".main-courses-grid").find("tr").each(function(){
		// 	$(this).find("td").eq(3).after("<td>0/0</td>");
		// });
		$(".main-courses-grid").find("th").eq(3).after("<th style='width: 120px'>Minimum Rating</th>");
		$(".main-courses-grid").find("tr").each(function(){
			$(this).find("td").eq(3).after("<td><input class='ratingSlider form-control'></td>");
		});
		var sliders = $(".ratingSlider").slider({
			min: 0,
			max: 5,
			value: 0,
			step: .1
		});

		sliders.each(function(){	//Load saved values
			// console.log($(this));
			// console.log(dataStorage[term][$(this).parent().prev().prev().prev().text().replace(/\s/g,"")]);
			// console.log(dataStorage[term]);
			// console.log(term);
			$(this).slider("setValue", parseFloat(dataStorage[term][$(this).parent().prev().prev().prev().text().replace(/\s/g,"")]));
		});

		var draggedElement = null;
		$(".ratingSlider").prev().mousedown(function(){
			draggedElement = $(this).next();
			console.log(draggedElement);
		});
		$(document).mouseup(function(){
			if(draggingGlobal){
				var val = parseFloat($(".globalRatingSlider").val());
				sliders.each(function(){
					$(this).slider("setValue", val);
				});
				$(".ratingSlider").each(function(){
					dataStorage[term][$(this).parent().prev().prev().prev().text().replace(/\s/g,"")] = $(this).val();
					iframeURL = $(this).parent().prev().prev().find("a").attr("onclick").split("'");
					iframeURL[0] = "http://vcu.collegescheduler.com/app/popup/pSelectCourseOptionsPaged.aspx?courseno=";
					iframeURL[2] = "&subject=";
					iframeURL[4] = "&term=";
					iframeURL[6] = "&coursetopicId=";
					iframeURL[8] = "&title=";
					iframeURL[10] = "&rating=" + $(this).val();
					console.log(iframeURL.join(""));
					$("<iframe></iframe>").attr("src", iframeURL.join("")).appendTo("#iframes");
					iframecounter++;
				});
			}
			draggingGlobal = false;
			if(draggedElement !== null && draggedElement.hasClass('ratingSlider')){
				// console.log(draggedElement.parent().prev().prev().prev().text().replace(/\s/g,""));
				// console.log(draggedElement.val());
				dataStorage[term][draggedElement.parent().prev().prev().prev().text().replace(/\s/g,"")] = draggedElement.val();
				iframeURL = draggedElement.parent().prev().prev().find("a").attr("onclick").split("'");
				iframeURL[0] = "http://vcu.collegescheduler.com/app/popup/pSelectCourseOptionsPaged.aspx?courseno=";
				iframeURL[2] = "&subject=";
				iframeURL[4] = "&term=";
				iframeURL[6] = "&coursetopicId=";
				iframeURL[8] = "&title=";
				iframeURL[10] = "&rating=" + draggedElement.val();
				console.log(iframeURL.join(""));
				$("<iframe></iframe>").attr("src", iframeURL.join("")).appendTo("#iframes");
				iframecounter++;

			}
			draggedElement = null;
			localStorage.setItem("data", JSON.stringify(dataStorage));
		});

		//Inject bootstrap/css
		var style = document.createElement("link");
		style.rel = "stylesheet";
		style.type = "text/css";
		style.href = chrome.extension.getURL("src/inject/bootstrap.min.css");
		(document.head||document.documentElement).appendChild(style);


		//Make main page tables full-width
		$(".main-courses-breaks")
		.children().add(".main-current").addClass("row")
		.children().addClass("col-md-12").width("100%")
		.filter(":last-child").css("padding", "0");
		$("#pnlCurrentAndStudentCart").width("690px");

		//Unhide those main page tables
		$("#pnlCurrentAndStudentCart, .main-courses-breaks").addClass("container").width("720px").css("display", "block");


		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("Hello. This message was sent from scripts/inject.js");
		// ----------------------------------------------------------
		localStorage.setItem("data", JSON.stringify(dataStorage));
		localStorage.setItem(schoolID, JSON.stringify(teacherData));
	}
	}, 10);
});

function getTeacherData(ID){
	var result;
	$.ajax({
		url: getTeacherSearchURL(ID, 1),
		type: "get",
		async: false,
		success: function(data){
			var num = JSON.parse(data).response.numFound;
			$.ajax({
				url: getTeacherSearchURL(ID, num),
				type: "get",
				async: false,
				success: function(data){
					result = JSON.parse(data).response.docs;
				}
			});
		}
	});
	return result;
}
function getTeacherSearchURL(ID, num){
	result = 'http://search.mtvnservices.com/typeahead/suggest/?solrformat=true&rows='
	+ num
	+ '&q=*:*+AND+schoolid_s:'
	+ ID
	+ '&defType=edismax&qf=teacherfullname_t^1000+autosuggest&bf=pow(total_number_of_ratings_i,2.1)&sort=teacherlastname_sort_s+asc&siteName=rmp&start=0&fl=pk_id+teacherfirstname_t+teacherlastname_t+total_number_of_ratings_i+averageratingscore_rf';
	return result;
}
function closeIFrame(){
	iframecounter--;
	if(!iframecounter){
		$("#iframes").children().each(function(){
			$(this).remove();
		});
	}
}
