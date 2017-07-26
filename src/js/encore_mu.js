/*#############################################################################
Project: en, extension+notifier for english-translated asian text-based media
Author: dustysys
Contact: dustysys@protonmail.com
Github: https://github.com/dustysys

File: encore_mu.js

This file contains the operations for accessing and modifying the local
List-Series-Release model. This includes loading and saving of the data from
local storage, as well as parsing www.mangaupdates.com html pages to get
information to store as data objects. All local creation, editing and deletion
of lists, series and releases is defined in the functions of this file.
#############################################################################*/

/**
 * Enum for MU list names
 */
var ListEnum = {
	READING: 0,
	WISH: 1,
	COMPLETE: 2,
	UNFINISHED: 3,
	ONHOLD: 4
}

/**
 * creates empty reading list. This is treated separately
 * because it can't be grabbed on the default MU MyList page,
 * since we know a user will always have on we can just
 * make it ourself.
 * @param {List} reading_list
 */
function createReadingList() {
	var reading_list = {
		list_id: "read",
		list_name: "Reading List",
		list_type: "read",
		series_list: []
	};

	return reading_list;
}

/**
 * sets local MU model volume/chapter using series ID
 * @param {string} volume
 * @param {string} chapter
 * @param {string} series_id
 * @param {function} callback
 */
function setMUVolumeChapterById(volume, chapter,series_id, callback) {
	loadData(function(data){
		var series = getSeriesById(data.lists, series_id);
		setMUVolume(volume, series);
		setMUChapter(chapter, series);
		
		saveData(data, callback);
	});
}

/**
 * sets local MU model volume/chapter
 * @param {string} volume
 * @param {string} chapter
 * @param {Series} series
 */
function setMUVolumeChapter(volume, chapter, series) {
	setMUVolume(volume, series);
	setMUChapter(chapter, series);
}

/**
 * sets the MU volume and chapter while indicating it was done
 * manually by the user
 * @param {string} volume
 * @param {string} chapter
 * @param {Series} series
 */
function manualSetMUVolumeChapter(volume, chapter, series) {
	setMUVolumeChapter(volume, chapter, series);
	series.last_update_was_manual = true;
}

/**
 * sets the MU volume and chapter while indicating it was done
 * automatically rather than being hand entered by the user
 * @param {string} volume
 * @param {string} chapter
 * @param {Series} series
 */
function autoSetMUVolumeChapter(volume, chapter, series) {
	setMUVolumeChapter(volume, chapter, series);
	series.last_update_was_manual = false;
}

/**
 * sets local MU model volume
 * @param {string} volume
 * @param {Series} series
 */
function setMUVolume(volume, series) {
	if (typeof volume == 'number') {
		if (volume < 1) volume = 1;
		volume = volume.toString();
	}
	series.mu_user_volume = volume;
}

/**
 * sets local MU model chapter
 * @param {string} chapter
 * @param {Series} series
 */
function setMUChapter(chapter, series) {
	if (typeof chapter == 'number') {
		if (chapter < 1) chapter = 1;
		chapter = chapter.toString();
	}
	series.mu_user_chapter = chapter;
}

/**
 * gets total number of new releases for all series in
 * lists of read type in listset
 * @param {List[]} data_lists
 * @returns {Number}
 */
function getTotalNumNewReadingReleases(data_lists) {
	var num = 0;
	for (var i = 0; i < data_lists.length; i++) {
		if (data_lists[i].list_type === "read") {
			num += getNumNewReleasesInList(data_lists[i]);
		}
	}
	return num;
}

/**
 * gets list based on MU list count
 * @param {List[]} data_lists
 * @param {number} num
 * @returns {List} corresponding to enum
 */
function getListByEnum(data_lists, num) {
	var list_id = getListIdByEnum(num);
	return getListById(data_lists, list_id);
}

function getListIdByEnum(num) {
	var list_id = "";
	// MU user lists start at 101
	// 101 = list id user1 112 = user12 etc
	if (num > 100) {
		num -= 100;
		list_id = "user" + num.toString();
	}
	else {
		switch (num) {
			case ListEnum.READING:
				list_id = "read";
				break;
			case ListEnum.WISH:
				list_id = "wish";
				break;
			case ListEnum.COMPLETE:
				list_id = "complete";
				break;
			case ListEnum.UNFINISHED:
				list_id = "unfinished";
				break;
			case ListEnum.ONHOLD:
				list_id = "hold";
				break;
			default:
				console.error("Error: Unknown list id");
				break;
		}
	}

	return list_id;
}

/**
 * gets the default url associated with series
 * @param {string} series_id
 * @returns {string}
 */
function getDefaultLink(series_id) {
	//TODO: add user-specified default link options

	var series_id = series_id;
	return "https://www.mangaupdates.com/series.html?id=" + series_id;
}

/**
 * evaluates if releases are unique
 * @param {Release} release1
 * @param {Release} release2
 * @returns {boolean}
 */
function releasesAreSame(release1, release2) {
	var release1_str = release1.groups + release1.volume + release1.chapter + release1.date;
	var release2_str = release2.groups + release2.volume + release2.chapter + release2.date;
	return (release1_str === release2_str);
}

/**
 * Sends the user a browser notification with release
 * Clicking it sends them to the series' designated url 
 * @param {Release} release
 * @param {Series} series
 */
function notifyOfRelease(release, series) {
	var exists_volume = (release.volume !== "");
	var exists_chapter = (release.chapter !== "");
	var chap_vol = "n/a";
	if (exists_volume && exists_chapter) {
		chap_vol = "v. " + release.volume + " c." + release.chapter;
	}
	else if (exists_chapter) {
		chap_vol = "c. " + release.chapter;
	}
	else if (exists_volume) {
		chap_vol = "v. " + release.volume;
	}

	var messages = [
		{ title: "Series: ", message: release.title },
		{ title: "Group: ", message: release.groups },
		{ title: "Release: ", message: chap_vol }
	];

	var opt = {
		type: "list",
		title: "New manga release",
		message: "New manga release",
		iconUrl: "../../img/icon128.png",
		items: messages
	};
	var url;
	if (exists(series.user_link)) {
		url = series.user_link;
	} else {
		url = getDefaultLink(series.series_id);
	}

	// TODO: give sufficient delay for firefox or figure out
	// why it isn't working otherwise
	chrome.notifications.create(url, opt, function (notif_id) {
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError);
		} else {
			console.log("Notification successful!");
		}
	});

}

/**
 * pulls the latest release for a series, marks it read, and
 * pushes the change to MU
 * @param {string} series_id
 * @param {function(Data)} callback
 */
function userPullThenPushSeriesUpToDate(series_id, callback) {
	scanSeriesLatestRelease(series_id, function (release) {
		loadData(function (data) {
			var series = getSeriesById(data.lists, series_id);
			setSeriesUpToDate(series, release);
			if (!exists(release)) {
				series.no_published_releases = true;
			}
			pushMUVolumeChapter(series.mu_user_volume, series.mu_user_chapter, series.series_id);
			saveData(data, callback);
		});
	});
}

/**
 * pulls the latest release for series and adds it to it
 * @param {string} series_id
 * @param {function(data)} callback
 */
function userPullSeriesLatestRelease(series_id, callback){
	scanSeriesLatestRelease(series_id, function (release) {
		loadData(function (data) {
			var series = getSeriesById(data.lists, series_id);
			if (exists(release)) {
				addNewRelease(release, series);
			} else series.no_published_releases = true;
			saveData(data, callback);
		});
	});
}

/**
 * sets the series latest release as the one provided and clears unread
 * releases
 * @param {Series} series
 * @param {Release} latest_release
 */
function setSeriesUpToDate(series, latest_release) {
	autoSetMUVolumeChapter(latest_release.volume, latest_release.chapter, series);
	if (exists(latest_release)) {
		series.latest_read_release = latest_release;
		if (!isEmpty(series.unread_releases)) {
			series.unread_releases = [];
		}

		if (!isEmpty(series.latest_unread_release)) {
			series.latest_unread_release = {};
		}
	}
}

/**
 * sets the series up to date with the local release and pushes to MU.
 * @param {string} series_id
 * @param {function(Data)} callback
 */
function userPushSeriesUpToDate(series_id, callback) {
	loadData(function (data) {
		var series = getSeriesById(data.lists, series_id);
		var release = getLatestRelease(series);
		setSeriesUpToDate(series, release);
		pushMUVolumeChapter(series.mu_user_volume, series.mu_user_chapter, series.series_id);
		saveData(data, callback);
	});
}

/**
 * attaches a link provided by the user to the series corresponding to the id
 * @param {string} series_id
 * @param {string} link
 * @param {function(Data)} callback
 */
function userSetSeriesLink(series_id, link, callback) {
	loadData(function (data) {
		var series = getSeriesById(data.lists, series_id);
		if (exists(series) && exists(link)) {
			series.user_link = link;
			saveData(data, callback);
		}
	});
}

/**
 * removes user_link property from series corresponding to id
 * @param {string} series_id
 * @param {function(Data)} callback
 */
function userClearSeriesLink(series_id, callback) {
	loadData(function (data) {
		var series = getSeriesById(data.lists, series_id);
		if (exists(series)) {
			delete series.user_link;
			saveData(data, callback);
		}
	});
}

/**
 * marks all series releases as having been seen by user
 * @param {string} series_id
 * @param {function(Data)} callback
 */
function userMarkSeriesReleasesSeen(series_id, callback) {
	loadData(function (data) {
		var series = getSeriesById(data.lists, series_id);
		series.unread_releases.forEach(function (item) {
			item.marked_seen = true;
		});
		series.latest_unread_release.marked_seen = true;
		saveData(data, callback);
	});
}

/**
 * deletes all series corresponding to ids in given array from lists, then
 * pushes the deletions to MU
 * @param {string} list_src_id
 * @param {string[]} delete_series_id_arr
 * @param {function(Data)} callback
 */
function userDeleteSeries(list_src_id, delete_series_id_arr, callback) {
	loadData(function (data) {
		removeSeriesArrayFromListById(data.lists, list_src_id, delete_series_id_arr);
		pushMUSeriesDelete(list_src_id, delete_series_id_arr);
		saveData(data, callback);
	});
}

/**
 * moves all series corresponding to ids in given array from specified list to
 * specified list, then pushes the moves to MU
 * @param {string} list_src_id
 * @param {string} list_dst_id
 * @param {string[]} move_series_id_arr
 * @param {function(Data)} callback
 */
function userMoveSeries(list_src_id, list_dst_id, move_series_id_arr, callback) {
	loadData(function (data) {
		moveSeriesArrayListToListById(data.lists, list_src_id, list_dst_id, move_series_id_arr);
		pushMUSeriesMove(list_src_id, list_dst_id, move_series_id_arr);
		saveData(data, callback);
	});
}

/**
 * updates local model with user input and pushes to MU
 * @param {string} series_id
 * @param {string} volume
 * @param {string} chapter
 * @param {function(Data)} callback
 */
function userManualUpdateVolumeChapter(series_id, volume, chapter, callback) {
	loadData(function (data) {
		var series = getSeriesById(data.lists, series_id);
		manualSetMUVolumeChapter(volume, chapter, series);
		pushMUVolumeChapter(series.mu_user_volume, series.mu_user_chapter, series.series_id);
		saveData(data, callback);
	});
}

/**
 * scans MU for unsaved user lists and returns in callback
 * @param {List[]} existing_lists
 * @param {function([List])} callback
 */
function scanForNewLists(existing_lists, callback) {
	var default_list = createReadingList();
	if (!hasList(existing_lists, default_list)) {
		existing_lists.push(default_list);
	}
	getMyListPage(function (list_page) {
		var parsed_lists = parseMyListPageForLists(list_page);
		var lists_to_add = [];
		parsed_lists.forEach(function (list) {
			if (!hasList(existing_lists, list)) {
				lists_to_add.push(list);
			}
		});
		// finish list scan by adding types
		pullListTypes(lists_to_add, callback);
	});
}

/**
 * sets up favorable pull results on MU
 * @param {List} data_list
 * @param {function} callback
 */
function primeListForPull(data_list, callback) {
	pushMUListPullOptions(data_list.list_id, function () {
		callback();
	});
}

/**
 * scans all series for specific list
 * @param {List} existing_list
 * @param {function(Series[])} callback
 */
function scanListForNewSeries(existing_list, callback) {
	getListPage(existing_list.list_id, function (list_page) {
		var s_list = [];
		var parser = new DOMParser();
		var doc = parser.parseFromString(list_page, "text/html");
		var alpha_select = doc.querySelector('[value=alpha]');
		var perpage_option = doc.querySelector('[value="All"]');
		if (!alpha_select.hasAttribute('checked') || !perpage_option.hasAttribute('selected')) {
			primeListForPull(existing_list, function () {
				scanListForNewSeries(existing_list, callback);
			});
		} else {
			var rows = doc.getElementsByClassName("lrow");
			for (var i = 0; i < rows.length; i++) {

				var s_url = rows.item(i).children[1].children[0].getAttribute("href");
				var id = s_url.substring(s_url.indexOf("=") + 1);

				if (!hasSeries(existing_list, id)) {
					var s_title = rows.item(i).children[1].children[0].children[0].textContent;
					var vol_digit = "";
					var chap_digit = "";
					var date = "";
					if (existing_list.list_type === "read") {
						var volume = rows.item(i).children[2].children[1].children[0].children[0].textContent;
						var chapter = rows.item(i).children[2].children[2].children[0].children[0].textContent;
						vol_digit = validateDigits(volume);
						chap_digit = validateDigits(chapter);
					}
					else if (existing_list.list_type === "wish" || existing_list.list_type === "complete") {
						date = rows.item(i).children[2].textContent;
						date = date.replace(/(\d+)(st,|nd,|rd,|th,)/, "$1");
						date = (new Date(date).toISOString());
					}
					else if (existing_list.list_type === "unfinished" || existing_list.list_type === "hold") {
						var vol_chap = rows.item(i).children[2].textContent;
						vol_digit = vol_chap.substring(2, vol_chap.indexOf('c.') - 1);
						chap_digit = vol_chap.substring(vol_chap.indexOf('c.') + 2);
					}

					var new_series = {
						series_id: id,
						title: s_title,
						mu_user_volume: vol_digit,
						mu_user_chapter: chap_digit,
						date_added: date,
						tracked: true,
						unread_releases: [],
						last_update_was_manual: true,
						no_published_releases: false
					};

					s_list.push(new_series);
				}
			}
			callback(s_list);
		}
	});
}

/**
 * returns a Series from its MU page
 * @param {string} series_id
 * @param {function(Series)} callback
 */
function scanSeries(series_id, callback) {
	getSeriesInfoPage(series_id, function (series_page) {
		var title = parseSeriesInfoPageForTitle(series_page);

		var series = {
			series_id: series_id,
			title: title,
			mu_user_volume: "1",
			mu_user_chapter: "1",
			date_added: (new Date(Date.now()).toISOString()),
			tracked: true,
			unread_releases: [],
			last_update_was_manual: true,
			no_published_releases: false
		};

		callback(series);
	});
}

/**
 * gets latest release from specific series release page
 * @param {string} series_id
 * @param {function(Release)} callback
 */
function scanSeriesLatestRelease(series_id, callback) {
	getSeriesReleasePage(series_id, function (release_page) {
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
			callback(release);
		}
		else {
			console.log("No releases found!");
			callback();
		}
	});
}

/**
 * scans for all releases from series' release page(unused/unfinished)
 * @param {string} series_id
 */
function scanSeriesLatestReleases(series_id) {
	getSeriesReleasePage(series_id, function(release_page){
		var parser = new DOMParser();
		var doc = parser.parseFromString(release_page, "text/html");
		var elm_list = doc.querySelectorAll('[title="Series Info"]');
		if (elm_list && elm_list.length>0){
			for (var i = 0; i < elm_list.length; i++) {
				
				var elm_title = elm_list[i];
				var elm_date = elm_title.parentElement.previousElementSibling;
				var elm_volume = elm_list[i].parentElement.nextElementSibling;
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
				
				for (var j = 0; j < elm_groups.children.length; j++)
				{
					if (j==0) r_groups += elm_groups.children[0].textContent;
					else{
						r_groups += " & " + elm_groups.children[j].textContent;
					}
				}
				
				
				var release = {
					date:r_date,
					title:r_title,
					volume:r_volume,
					chapter:r_chapter,
					groups: r_groups,
					marked_seen: false
				};
					console.log(release);
					
				}
			}
		else {
			console.log("No releases found!");
		}
	});
}

/**
 * scans for series_id:release tuples on new release page
 * TODO: the heavy indentation of all the parser functions isn't great,
 * but this one is out of control. Refactor.
 * @typedef {Object} SeriesReleasePair
 * @param {function(SeriesReleasePair[])} callback
 */
function scanNewReleases(callback) {
	var new_releases_page_num = "1";
	getNewReleasesPage(new_releases_page_num, function (new_releases_page) {
		loadLatestReleaseUpdate(function (latest_release_update) {
			var series_id_release_pairs = [];
			var parser = new DOMParser();
			var doc = parser.parseFromString(new_releases_page, "text/html");
			var elm_date_list = doc.querySelectorAll('[style="display:inline"]');
			if (elm_date_list && elm_date_list.length > 0) {
				for (var i = 0; i < elm_date_list.length; i++) {
					var elm_date = elm_date_list[i].firstElementChild;
					var str_date = elm_date.textContent;
					var str_date_sans_day = str_date.substring(str_date.indexOf(",") + 2);
					var str_date_parsed = str_date_sans_day.replace(/(\d+)(st|nd|rd|th)/, "$1");
					var date_obj = new Date(str_date_parsed);
					var r_date = date_obj.toISOString();

					var release_root = elm_date_list[i].nextElementSibling.querySelectorAll('img[src="images/listicons/type0.gif"]');
					if (release_root && release_root.length > 0) {
						for (var j = 0; j < release_root.length; j++) {
							var elm_title = release_root[j].parentElement.nextElementSibling;
							var elm_vol_chap = elm_title.parentElement.nextElementSibling;
							var elm_groups = elm_vol_chap.nextElementSibling;
							var series_link = elm_title.getAttribute("href");
							var series_id = series_link.substring(series_link.indexOf("=") + 1);

							var r_title = elm_title.textContent;
							var r_vol_chap = elm_vol_chap.textContent;
							var r_volume = "";
							var r_chapter = "";
							var r_groups = "";

							var vol_indicators = instancesOf(elm_vol_chap.textContent, "v.", true);
							var chap_indicators = instancesOf(elm_vol_chap.textContent, "c.", true);
							if (vol_indicators == 1 && chap_indicators == 0) {
								r_volume = r_vol_chap.substring(3);
							}
							else if (vol_indicators == 0 && chap_indicators == 1) {
								r_chapter = r_vol_chap.substring(3);
							}
							else if (vol_indicators == 1 && chap_indicators == 1) {
								r_volume = r_vol_chap.substring(3, r_vol_chap.indexOf('c.') - 1);
								r_chapter = r_vol_chap.substring(r_vol_chap.indexOf('c.') + 2);
							}

							for (var k = 0; k < elm_groups.children.length; k++) {
								if (k == 0) r_groups += elm_groups.children[0].textContent;
								else {
									r_groups += " & " + elm_groups.children[k].textContent;
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

							if (i === 0 && j === 0 && exists(release)) {
								saveLatestReleaseUpdate(release);
							}

							if (latest_release_update && latest_release_update !== "No Release") {
								if (releasesAreSame(latest_release_update, release)) {
									console.log("Checked up to latest release!");
									// break out of the loops:
									i = elm_date_list.length;
									j = release_root.length;
								} else {
									series_id_release_pairs.push([series_id, release]);
								}
							} else {
								series_id_release_pairs.push([series_id, release]);
							}
						}
					}
				}
			}
			callback(series_id_release_pairs);
		});
	});
}

/**
 * gets users MU id
 * @param {function(string)} callback
 */
function scanLoggedInUserId(callback) {
	getMembersPage(function (members_page) {
		var user_id = parseMembersPageForUserId(members_page);
		if (exists(user_id)) {
			callback(user_id);
		} else callback("No User");
	});
}

/**
 * gives lists types based on scanned icon enum
 * @param {List[]} data_lists
 * @param {function(List)} callback
 */
function pullListTypes(data_lists, callback) {
	if (data_lists.length > 0) {
		setDefaultListsTypes(data_lists);
		pullCustomListsTypes(data_lists, callback);
	} else callback(data_lists);
}

function setDefaultListsTypes(data_lists) {
	data_lists.forEach(function (list) {
		var default_list_ids = ["read", "wish", "complete", "unfinished", "hold"];
		var list_id = list.list_id;
		if (default_list_ids.includes(list_id)) {
			list.list_type = list.list_id;
		}
	});
}

/**
 * scans and sets the types for custom lists
 * @param {List[]} data_lists
 * @param {function(List[])} callback
 */
function pullCustomListsTypes(data_lists, callback) {
	getEditListPage(function (edit_list_page) {
		var list_id_type_pairs = parseEditListPageForTypes(edit_list_page);
		list_id_type_pairs.forEach(function (pair) {
			var list_id = pair[0];
			var list_type = pair[1];
			var list = getListById(data_lists, list_id);
			if (exists(list)) {
				list.list_type = list_type;
			}
		});
		if (callback) callback(data_lists);
	});
}

/**
 * scans MU for and adds any unsaved lists to a listset
 * @param {List[]} data_lists
 * @param {function} callback
 */
function pullLists(data_lists, callback) {
	scanForNewLists(data_lists, function (new_lists) {
		addLists(data_lists, new_lists);
		callback();
	});
}

/**
 * pulls data series for each MU list
 * @param {List[]} data_lists
 * @param {function} callback
 */
function pullSeriesInLists(data_lists, callback) {
	var lists_pulled = 0;
	if (data_lists.length > 0) {
		data_lists.forEach(function (item, index, array) {
			scanListForNewSeries(item, function (series_list) {
				addSeriesToList(item, series_list);
				lists_pulled++;
				if (lists_pulled === array.length) {
					callback();
				}
			});
		});
	} else callback();

}

/**
 * pulls a specified series to a list
 * @param {List} data_list
 * @param {string} series_id
 * @param {function} callback
 */
function pullSeriesToListById(data_list, series_id, callback) {
	scanSeries(series_id, function (series) {
		data_list.series_list.push(series);
		if (callback) callback();
	});
}

/**
 * pulls specified series' latest release
 * @param {Series} series
 */
function pullSeriesLatestRelease(data_series) {
	scanSeriesLatestRelease(data_series.series_id, function (release) {
		
	});
}

/**
 * updates series from any read lists in listset
 * with any new entries from new releases page
 * @param {List[]} data_lists
 * @param {function} callback
 */
function pullNewReleases(data_lists, callback) {
	scanNewReleases(function (series_id_release_pairs) {
		for (var i = 0; i < series_id_release_pairs.length; i++) {
			var read_lists = getListsByType(data_lists, "read");
			var id = series_id_release_pairs[i][0];
			var release = series_id_release_pairs[i][1];
			var series = getSeriesById(read_lists, id);

			if (exists(series) && releaseIsNew(series, release)) {
				addNewRelease(release, series);
				notifyOfRelease(release, series);
			}
		}
		setBadge(data_lists);
		callback();
	});
}

/**
 * gets the id of both the currently logged into MU user and the
 * user id of the previous instance of en
 * @param {function(string)} callback
 */
function pullUserSessionInfo(callback) {
	loadCurrentUserId(function (current_user_id) {
		scanLoggedInUserId(function (logged_in_user_id) {
			callback(current_user_id, logged_in_user_id);
		});
	});
}

/**
 * pulls the entire collection of lists and series from MU
 * @param {function} callback
 */
function pullAllData(callback){
	loadData(function(data){		
		if (data === "No Data"){
				console.log("No data stored, populating lists");
				data = { lists:[] };
		}

		pullLists(data.lists, function(){
			pullSeriesInLists(data.lists, function(){
				saveData(data, function () {
					if (callback) callback();
				});
			});
		});
	});
}

/**
 * checks for new releases for all series in all lists
 */
function updateLists(){
	loadData(function(data){
		if (data === "No Data") {
			console.log("Error: No data to update");
		} else {
			pullNewReleases(data.lists, function () {
				saveData(data);
			});
		}
	});		
}

/**
 * creates a new session based on logged in user and downloads
 * all data
 * @param {string} user_id
 * @param {function} callback
 */
function initializeNewSession(user_id, callback) {
	saveCurrentUserId(user_id, function () {
		pullAllData(function () {
			callback();
		});
	});
}