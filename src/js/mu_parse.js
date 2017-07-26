﻿

function parseMyListPageForLists(list_page) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(list_page, "text/html");
	var elms = doc.querySelectorAll('[href^="https://www.mangaupdates.com/mylist.html?list="]');
	var parsed_lists = [];
	for (var i = 0; i < elms.length; i++) {
		var link = elms[i].getAttribute("href");
		var list_id = link.substring(link.indexOf("=") + 1);
		var list_name = elms[i].firstElementChild.textContent;
		var parsed_list = {
			list_id: list_id,
			list_name: list_name,
			list_type: "",
			series_list: []
		};
			parsed_lists.push(parsed_list);
	}
	return parsed_lists;
}

function parseEditListPageForTypes(edit_list_page) {
	var list_id_type_pairs = [];
	var edit_list_parser = new DOMParser();
	var edit_list_doc = edit_list_parser.parseFromString(edit_list_page, "text/html");
	var select_elms = edit_list_doc.getElementsByTagName('select');
	for (var i = 0; i < select_elms.length; i++) {
		var select_name = select_elms[i].name;
		if (select_name.includes("][type]")) {
			var list_num = parseInt(select_name.substring(6, select_name.indexOf("][type]")));
			var selected_type = select_elms[i].querySelector('[selected="selected"]');
			var list_id = getListIdByEnum(list_num);
			var list_type = selected_type.value;
			list_id_type_pairs.push([list_id, list_type]);
		}
	}
	return list_id_type_pairs;
}

function parseMembersPageForUserId(members_page) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(members_page, "text/html");
	var login_box = doc.getElementById("login_box_padding");
	var user_page_link = login_box.children[0].getAttribute("href");
	if (exists(user_page_link)) {
		var user_id = user_page_link.substring(user_page_link.indexOf("=") + 1);
		return user_id;
	} else return null;
}

function parseSeriesInfoPageForTitle(series_page) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(series_page, "text/html");
	var title_elms = doc.getElementsByClassName("releasestitle tabletitle");
	var title = title_elms[0].textContent;
	return title;
}

function parseSeriesReleasePageForLatestRelease(release_page) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(release_page, "text/html");
	var elm_list = doc.querySelector('[title="Series Info"]');
	if (elm_list) {

		var elm_title = elm_list;
		var elm_date = elm_title.parentElement.previousElementSibling;
		var elm_volume = elm_list.parentElement.nextElementSibling;
		var elm_chapter = elm_volume.nextElementSibling;
		var elm_groups = elm_chapter.nextElementSibling;

		var default_date = new Date(1970, 1, 1);
		var r_date = default_date.toISOString();
		if (validateDigits(elm_date.textContent) !== "") {
			var actual_date = new Date(elm_date.textContent);
			r_date = actual_date.toISOString();
		}
		var r_title = elm_title.textContent;
		var r_volume = elm_volume.textContent;
		var r_chapter = elm_chapter.textContent;
		var r_groups = "";

		for (var j = 0; j < elm_groups.children.length; j++) {
			if (j == 0) r_groups += elm_groups.children[0].textContent;
			else {
				r_groups += " & " + elm_groups.children[j].textContent;
			}
		}
		var release = {
			date: r_date,
			title: r_title,
			volume: r_volume,
			chapter: r_chapter,
			groups: r_groups,
			marked_seen: false
		};
		return release;

	} else return null;
}