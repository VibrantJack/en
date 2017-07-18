﻿/*#############################################################################
File: popup.js

This script runs when the user selects the chrome browser action button and
popup.html is loaded. User interaction with the popup is handled here.
Handlers call encore_mu functions 
#############################################################################*/

var global_last_clicked_el;
var global_block_transitions = false;
var global_pref_scrollbar = { enabled: false };
var global_pref_animations = { enabled: true }; 
var global_pref_one_click_uptodate = { enabled: true };
var global_pref_release_update = { enabled: true, interval: 15 };
var global_pref_list_sync = { enabled: true, interval: 60 };
var global_pref_notifications = { enabled: true };

/**
 * DOM HELPER FUNCTIONS
 *
 * DOM traversal methods are aggregated here to make updating them
 * simpler after modifying the DOM popup structure.
 */

/**
 * 
 * @param {Element} title_block
 * @returns {Element}
 */
function getTitleBlocksTitleLink(title_block) {
	return title_block.firstChild.firstChild.firstChild;
}

/**
 * 
 * @param {Element} series_row
 * @returns {Element}
 */
function getSeriesRowsEditLinkButton(series_row) {
	return series_row.firstChild.children[1].firstChild;
}

/**
 * 
 * @param {Element} link_button
 * @returns {Element}
 */
function getEditLinkButtonsLinkIcon(link_button) {
	return link_button.firstChild;
}

/**
 * 
 * @param {Element} series_row
 * @returns {Element}
 */
function getSeriesRowsEditLinkWrap(series_row) {
	return series_row.firstChild.children[1];
}

/**
 * 
 * @param {Element} input_link
 * @returns {Element}
 */
function getInputLinksSeriesRow(input_link) {
	return input_link.parentElement.parentElement;
}

/**
 * 
 * @param {Element} series_row
 * @returns {Element}
 */
function getSeriesRowsUpToDateButton(series_row) {
	var uptodate_button = series_row.querySelector('.upToDateButton');
	return uptodate_button;
}

function getSeriesRowsSeriesSelectWrap(series_row) {
	var select_wrap = series_row.querySelector('.seriesSelectWrap');
	return select_wrap;
}
/**
 * 
 * @param {Element} series_row
 * @returns {Element}
 */
function getSeriesRowsSeriesSelectButton(series_row) {
	var select_button = series_row.querySelector('.seriesSelectButton');
	return select_button;
}
/**
 * 
 * @param {Element} series_row
 * @returns {Element}
 */
function getSeriesRowsTable(series_row) {
	return getSeriesRowsWrap(series_row).parentElement;
}

/**
 * 
 * @param {Element} series_row
 * @returns {Element}
 */
function getSeriesRowsWrap(series_row) {
	return series_row.parentElement;
}
/**
 * 
 * @param {Element} series_row
 * @returns {Element}
 */
function getSeriesRowsTitleLink(series_row) {
	return series_row.firstChild.firstChild.firstChild.firstChild;
}
/**
 * 
 * @param {Element} title_link
 * @returns {Element}
 */
function getTitleLinksSeriesRow(title_link) {
	return title_link.parentElement.parentElement.parentElement.parentElement;
}

/**
 * 
 * @param {Element} edit_link_button
 * @returns {Element}
 */
function getEditLinkButtonsTitleBlock(edit_link_button) {
	return edit_link_button.parentElement.parentElement;
}

function getEditLinkIconsTitleBlock(edit_link_icon) {
	var edit_link_button = edit_link_icon.parentElement;
	return getEditLinkButtonsTitleBlock(edit_link_button);
};

/**
 * 
 * @param {Element} field
 * @returns {Element}
 */
function getReleaseFieldsSeriesRow(field) {
	var display = getReleaseFieldsReleaseDisplay(field);
	return display.parentElement.parentElement.parentElement;
}
/**
 * 
 * @param {Element} field
 * @returns {Element}
 */
function getReleaseFieldsReleaseDisplay(field) {
	return field.parentElement;
}

/**
 * 
 * @param {Element} input
 * @returns {Element}
 */
function getReadInputsReleaseLine(input) {
	return input.parentElement;
}

/**
 * 
 * @param {Element} button
 * @returns {Element}
 */
function getUpToDateButtonsSeriesRow(button) {
	return button.parentElement.parentElement.parentElement;
}

/**
 * gets the currently displayed list table
 * @returns {Element}
 */
function getCurrentListTable() {
	var list_id = getCurrentListId();
	return document.querySelector('.listTable[list_id=' + list_id + ']');
}

/**
 * initiates marking series up to date and changes display elements to match
 * the data is saved, an updated series row built and the updated chapter pushed to MU
 * @param {Event} event
 */
function pullSeriesRowUpToDate(series_row) {
	var table = getSeriesRowsTable(series_row);
	var series_id = getSeriesRowsId(series_row);
	userPullThenPushSeriesUpToDate(series_id, function (data) {
		// in case sync thread changed parent element
		var async_series_row = table.querySelectorAll(".seriesRow[series_id=s" + series_id + "]")[0];
		var list = getList(data.lists, async_series_row.getAttribute("list_id"));
		var series = getSeriesById([list], series_id);
		var updated_row = updateSeriesRow(async_series_row, list, series);
		var uptodate_button = getSeriesRowsUpToDateButton(updated_row);
		uptodate_button.style.display = "none";
	});

	finalizeMarkSeriesRowUpToDate(series_row);
}



function updateSeriesRowsLatestRelease(series_row) {
	var series_id = getSeriesRowsId(series_row);
	userPullSeriesLatestRelease(series_id, function (data) {
		var list = getList(data.lists, series_row.getAttribute("list_id"));
		var series = getSeriesById([list], series_id);
		var updated_row = updateSeriesRow(series_row, list, series);
		var updated_uptodate_button = getSeriesRowsUpToDateButton(updated_row);
		updated_uptodate_button.onclick = (function () {
			executeMarkSeriesRowUpToDate(updated_row);
		});
	});
}

function finalizeMarkSeriesRowUpToDate(series_row) {
	var uptodate_button = getSeriesRowsUpToDateButton(series_row)
	hideElement(uptodate_button);
	var start_el_index = listFilterIsInUse() ? getIndexOfVisibleSeriesRow(series_row) : getIndexOfSeriesRowInDOM(series_row);
	var start_bbox = series_row.getBoundingClientRect();
	var end_el_index = sortInsertMarkedReadSeriesRow(series_row);
	if (listFilterIsInUse()) end_el_index = getIndexOfVisibleSeriesRow(series_row);
	var end_bbox = series_row.getBoundingClientRect();
	animateSeriesUpdate(series_row, start_el_index, end_el_index, start_bbox, end_bbox);
}

function executeMarkSeriesRowUpToDate(series_row, callback) {
	var series_id = getSeriesRowsId(series_row);
	userPushSeriesUpToDate(series_id, function (data) {
		var list = getList(data.lists, series_row.getAttribute("list_id"));
		var series = getSeriesById([list], series_id);
		var updated_row = updateSeriesRow(series_row, list, series);
		if (callback) callback(updated_row);
	});
}

function giveUpToDateButtonSortPrompt(series_row) {
	var uptodate_button = getSeriesRowsUpToDateButton(series_row);
	uptodate_button.textContent = "\u2b07";
	uptodate_button.style.display = "";
	series_row.setAttribute("unsorted", "true");
	uptodate_button.onclick = (function () {
		finalizeMarkSeriesRowUpToDate(series_row);
	});
}

function handleUpToDate(event) {
	var series_row = getUpToDateButtonsSeriesRow(event.target);
	if (global_pref_one_click_uptodate.enabled) {
		pullSeriesRowUpToDate(series_row);
	} else {
		var uptodate_button = event.target;
		var uptodate_status = uptodate_button.getAttribute("up_to_date");
		
		if (uptodate_status === "unknown") {
			updateSeriesRowsLatestRelease(series_row);
		} else {
			executeMarkSeriesRowUpToDate(series_row, function (updated_row) {
				if (!isLastVisibleSeriesRow(updated_row)) {
					giveUpToDateButtonSortPrompt(updated_row);
				}
			});
		}
	}
}
 
function isLastVisibleSeriesRow(series_row) {
	var is_last = false;
	var vis_rows = getVisibleSeriesRows();
	var vis_index = getIndexOfVisibleSeriesRow(series_row);
	if (vis_index === vis_rows.length - 1) return true;
	else return false;
}

/**
 * gives total height of the series row class element
 * @returns {Number}
 */
function getSeriesRowVerticalSize() {
	var cs = window.getComputedStyle(document.documentElement);
	var row_height = cs.getPropertyValue('--row-height');
	var row_margin = cs.getPropertyValue('--row-margin-vert');
	var row_border = cs.getPropertyValue('--std-border-width');
	var vert = parseInt(row_height) + parseInt(row_margin) + parseInt(row_border) + parseInt(row_border);
	return vert;
}

/**
 * gets the series id associated with series row element
 * @param {Element} series_row
 * @returns {string}
 */
function getSeriesRowsId(series_row) {
	return series_row.getAttribute("series_id").substring(1);
}

/**
 * gives num rows that could fit onscreen based on css
 * @returns {Number}
 */
function getNumRowsFitOnScreen() {
	var cs = window.getComputedStyle(document.documentElement);
	var window_height = parseInt(cs.getPropertyValue('--popup-height'));
	var vert = getSeriesRowVerticalSize();
	var header_height = parseInt(cs.getPropertyValue('--navbar-height'));
	var num_rows_fit_onscreen = Math.round((window_height - header_height) / vert);
	return num_rows_fit_onscreen;
}

/**
 * gets all the series row elements that could be on screen
 * @returns {Element[]}
 */
function getOnScreenSeriesRows() {
	var scroll_pos = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
	var num_rows_fit_onscreen = getNumRowsFitOnScreen();
	var vert = getSeriesRowVerticalSize();
	var index = Math.round(scroll_pos / vert);
	//buffer rows for rounding errors
	var buffer_rows = 3;
	var start_row = index - buffer_rows;
	if (start_row < 0) start_row = 0;
	var end_row = index + num_rows_fit_onscreen + buffer_rows;
	var vis_rows = getVisibleSeriesRows();
	var onscreen_rows = Array.prototype.slice.call(vis_rows, start_row, end_row);

	return onscreen_rows;
}

/**
 * gets all series rows whose self and parents arent hidden
 * @returns {Element[]}
 */
function getVisibleSeriesRows() {
	return getVisibleElementsByClass("seriesRow");
}

/**
 * gets the index of a series row relative to other visible rows
 * @param {Element} series_row
 * @returns {Number}
 */
function getIndexOfVisibleSeriesRow(series_row) {
	var visible_rows = getVisibleSeriesRows();
	for (var index = 0; index < visible_rows.length; index++) {
		if (seriesRowsAreSame(series_row, visible_rows[index])) {
			return index;
		}
	}
}

/**
 * gets index of a series row relative to its wrapper's
 * siblings in the DOM
 * @param {Element} series_row
 * @returns {Number}
 */
function getIndexOfSeriesRowInDOM(series_row) {
	var el = getSeriesRowsWrap(series_row);
	var el_index = 0;
	for (el_index; (el = el.previousSibling); el_index++);
	return el_index;
}

/**
 * evaluates if two rows are for the same series
 * @param {Element} series_row1
 * @param {Element} series_row2
 * @returns
 */
function seriesRowsAreSame(series_row1, series_row2) {
	return series_row1.getAttribute("series_id") === series_row2.getAttribute("series_id")
}

/**
 * replaces series row with updated version without touching
 * its (potentially animated) wrapper
 * @param {Element} series_row
 * @param {List} data_list
 * @param {Series} data_series
 * @returns {Element} updated row
 */
function updateSeriesRow(series_row, data_list, data_series) {
	var series_row_wrap = getSeriesRowsWrap(series_row);
	var updated_row_wrap = buildSeriesRow(data_list, data_series);
	replaceElementInPlace(updated_row_wrap, series_row_wrap);
	return updated_row_wrap.firstChild;
}

/**
 * inserts series row in proper place assuming array is pre-sorted
 * @param {Element} series_row
 * @return {Number} new index of series row 
 */
function sortInsertMarkedReadSeriesRow(series_row) {
	var title = series_row.querySelectorAll(".titleLink")[0].innerHTML;
	var table = getSeriesRowsTable(series_row);
	var row_titles = table.querySelectorAll(".titleLink");

	if (row_titles.length === 1) return;
	let index = 0;
	while (index < row_titles.length) {
		var row = getTitleLinksSeriesRow(row_titles[index]);
		var has_new_releases = row.getAttribute("new_releases") === "true";
		var is_sorted = !(row.hasAttribute("unsorted"));
		if (!has_new_releases && is_sorted) {
			if (title.toUpperCase() < row_titles[index].innerHTML.toUpperCase()) {
				break;
			}
		}
		index++;
	}

	if (series_row.hasAttribute("unsorted")) series_row.removeAttribute("unsorted");
	var series_row_wrap = getSeriesRowsWrap(series_row);
	table.insertBefore(series_row_wrap, table.children[index]);
	return index - 1;
}

/**
 * gets currently shown list
 * @returns
 */
function getCurrentListId() {
	return document.getElementById("currentListSelect").value;
}

/**
 * gets currently active move-to list
 * @returns
 */
function getMoveToListId() {
	return getManageListId();
}

/**
 * gets manage-series list select's current choice
 * @returns {string}
 */
function getManageListId() {
	return document.getElementById("manageSeriesListSelect").value;
}

/**
 * gets the DOM table element containing the specified list
 * @param {string} list_id
 * @returns {Element}
 */
function getListTableById(list_id) {
	return document.querySelector(".listTable[list_id=" + list_id + "]");
}

/**
 * checks if filter is applied
 * @returns
 */
function listFilterIsInUse() {
	return exists(document.getElementById("seriesRowListFilter").value);
}

/**
 * evaluates whether manage mode is currently on
 * @returns {boolean}
 */
function manageModeOn() {
	var toggle = document.getElementById("manageSeriesButton").getAttribute("toggle") === "on";
	return toggle;
}

/**
 * evaluates if element is visible
 * @param {Element} el
 * @returns {boolean}
 */
function elementIsVisible(el) {
	return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
}

/**
 * gets all visible elements of the DOM class specified
 * @param {string} class_name
 * @returns {Element[]}
 */
function getVisibleElementsByClass(class_name) {
	var vis_els = [];
	var els = document.body.querySelectorAll('.' + class_name);
	for (var i = 0; i < els.length; i++) {
		if (elementIsVisible(els[i])) {
			vis_els.push(els[i]);
		}
	}
	return vis_els;
}

/**
 * gets index of an element relative to its siblings in DOM
 * @param {Element} el
 * @returns {Number}
 */
function getIndexOfElementInDOM(el) {
	var el_index = 0;
	for (el_index; (el = el.previousSibling); el_index++);
	return el_index;
}

/**
 * replaces element without modifying its DOM position
 * @param {Element} new_el
 * @param {Element} old_el
 */
function replaceElementInPlace(new_el, old_el) {
	old_el.parentElement.replaceChild(new_el, old_el);
}

/**
 * resets the all series select button
 */
function resetSelectAllSeriesButton() {
	document.getElementById("selectAllButton").setAttribute("toggle", "off");
}

/**
 * resets the toggle for every series select button
 */
function resetAllSelectSeriesButtons() {
	resetSelectAllSeriesButton();
	var select_buttons = document.body.querySelectorAll(".seriesSelectButton");
	for (var i = 0; i < select_buttons.length; i++) {
		select_buttons[i].setAttribute("toggle", "off");
	}
}

/**
 * swaps between visibility of marked up to date and series select button visibilities
 * @param {boolean} toggle
 */
function toggleSeriesSelectVisibility(toggle) {

	var uptodate_buttons = document.body.getElementsByClassName("upToDateButton");
	var select_buttons = document.body.getElementsByClassName("seriesSelectWrap");

	for (var i = 0; i < uptodate_buttons.length; i++) {
		var uptodate_status = uptodate_buttons[i].getAttribute("up_to_date");
		if (uptodate_status === "false" || uptodate_status === "unknown") {
			toggleElementVisibility(uptodate_buttons[i], !toggle);
		}
	}

	for (var i = 0; i < select_buttons.length; i++) {
		toggleElementVisibility(select_buttons[i], toggle);
	}
}

function toggleEditLinkVisibility(toggle){
	var link_wraps = document.body.getElementsByClassName("editLinkWrap");
	for (var i = 0; i < link_wraps.length; i++) {
		toggleElementVisibility(link_wraps[i], toggle);
	}
}

/**
 * switches an elements toggle attribute, returns toggle's new truth value
 * @param {Element}
 * @returns {boolean}
 */
function toggleElement(element) {
	var toggle = element.getAttribute("toggle") === "on";
	element.setAttribute("toggle", toggle ? "off" : "on");
	return !toggle;
}

/**
 * generic function for toggling any element's visibility
 * @param {Element} el
 * @param {boolean} toggle
 */
function toggleElementVisibility(el, toggle) {
	if (typeof toggle === "boolean") {
		toggle ? showElement(el) : hideElement(el);
	} else console.error("Error: toggleElement requires toggle");
}
 
function hideElement(el) {
	fastdom.mutate(function () { el.style.display = "none"; });
}

function showElement(el) {
	fastdom.mutate(function () { el.style.display = ""; });
}
 
/**
 * toggles visibility of the manage series field elements
 * @param {boolean} toggle
 */
function toggleManageFieldVisibility(toggle) {
	var manage_field = document.getElementById("manageSeriesField");
	var options_button = document.getElementById("optionsButton");
	toggleElementVisibility(manage_field, toggle);
	toggleElementVisibility(options_button, !toggle);
	global_block_transitions = false;
}

/**
 * toggles the visibility for all elements attached to manage mode
 * @param {boolean} toggle
 */
function toggleManageModeVisibility(toggle) {
	toggleManageFieldVisibility(toggle);
	toggleSeriesSelectVisibility(toggle);
	toggleEditLinkVisibility(toggle);
}

/**
 * turns series manage mode on
 * @param {Event} event
 */
function handleManageSeries(event) {
	if (!global_block_transitions || !global_pref_animations.enabled) {
		global_block_transitions = true;
		//event may be button or its description
		var manage_button = document.getElementById("manageSeriesButton");
		var toggle = toggleElement(manage_button);
		animateToggleManageMode(toggle, toggleManageModeVisibility);
	}
}

function toggleOptionPageVisibility(toggle) {
	window.scrollTo(0, 0);
	var opt_tables = document.getElementsByClassName("optionTable");
	var popup = document.getElementById("popup");
	if (toggle) {
		hideAllLists();
		if (opt_tables.length === 0) {
			popup.appendChild(buildOptionTable());
		} else {
			toggleElementVisibility(opt_tables[0], toggle);
		}
	} else {
		if (opt_tables.length > 0) {
			toggleElementVisibility(opt_tables[0], toggle);
			changeToSelectedCurrentList();
		}
	}
}

function toggleOptionModeVisibility(toggle) {
	var other_buttons = document.querySelectorAll('#manageSeriesButton, #currentListField');
	for (var i = 0; i < other_buttons.length; i++) {
		toggleElementVisibility(other_buttons[i], !toggle);
	}
}

function handleToggleOptions(event) {
	var toggle = toggleElement(event.target);
	// load page before animation
	toggleOptionPageVisibility(toggle);
	
	animateToggleOptionMode(toggle, toggleOptionModeVisibility);
}

/**
 * Toggles the series select for all elements
 * @param {Event} event
 */
function handleSelectAllSeries(event) {
	var toggle = toggleElement(event.target);
	var select_buttons = getVisibleElementsByClass("seriesSelectButton");
	if (select_buttons !== null) {
		for (var i = 0; i < select_buttons.length; i++) {
			select_buttons[i].setAttribute("toggle", toggle ? "on" : "off");
		}
	}
}

/**
 * toggles series select and handles shift-click functionality
 * @param {Event} event
 */
function handleSeriesSelect(event) {
	var last_clicked = global_last_clicked_el;
	if (!event.shiftKey || last_clicked === event.target) {
		var tog = toggleElement(event.target);
		if (!tog) resetSelectAllSeriesButton();
	} else if (last_clicked !== event.target && last_clicked.className === "seriesSelectButton") {
		var vis_rows = getVisibleSeriesRows();
		var vis_select_buttons = [];
		var index1_found = false;
		var index1;
		var index2;
		for (var i = 0; i < vis_rows.length; i++) {
			vis_select_buttons.push(vis_rows[i].querySelectorAll(".seriesSelectButton")[0]);
		}
		for (var i = 0; i < vis_select_buttons.length; i++) {
			if (vis_select_buttons[i] === last_clicked || vis_select_buttons[i] === event.target) {
				if (!index1_found) {
					index1 = i;
					index1_found = true;
				} else {
					index2 = i;
					break;
				}
			}
		}
		for (var i = index1 + 1; i < index2; i++) {
			toggleElement(vis_select_buttons[i]);
		}
		toggleElement(event.target);
	}
}

/**
 * removes selected series from popup, locally and pushes deletion to MU
 */
function handleDeleteSeries() {
	var series_rows = getVisibleSeriesRows();
	var delete_series_id_arr = [];
	for (var i = 0; i < series_rows.length; i++) {
		var select_button = getSeriesRowsSeriesSelectButton(series_rows[i]);
		if (select_button.getAttribute("toggle") === "on") {
			delete_series_id_arr.push(getSeriesRowsId(series_rows[i]));
			series_rows[i].parentElement.removeChild(series_rows[i]);
		}
	}
	var list_src_id = getCurrentListId();

	userDeleteSeries(list_src_id, delete_series_id_arr);
}

/**
 * changes series to a different list on popup, locally and pushes move to MU
 */
function handleMoveSeries() {
	var list_src_id = getCurrentListId();
	var list_dst_id = getMoveToListId();
	if (list_src_id === list_dst_id) return;
	var series_rows = getVisibleSeriesRows();

	var move_series_id_arr = [];
	for (var i = 0; i < series_rows.length; i++) {
		var select_button = getSeriesRowsSeriesSelectButton(series_rows[i]);
		if (select_button.getAttribute("toggle") === "on") {
			move_series_id_arr.push(getSeriesRowsId(series_rows[i]));
			series_rows[i].parentElement.removeChild(series_rows[i]);
		}
	}

	userMoveSeries(list_src_id, list_dst_id, move_series_id_arr, function (data) {
		var dst_list_table = getListTableById(list_dst_id);
		if (dst_list_table !== null) {
			var updated_table = buildListTable(getListById(data.lists, list_dst_id));
			updated_table.style.display = "none";
			replaceElementInPlace(updated_table, dst_list_table);
		}
	});
}

/**
 * switches which list is currently shown
 * @param {Event} event
 */
function handleCurrentListChange(event) {
	document.getElementById("seriesRowListFilter").value = "";
	var filter = "";
	filterList(filter);
	resetAllSelectSeriesButtons();
	changeToSelectedCurrentList();
}

function changeToSelectedCurrentList() {
	window.scrollTo(0, 0);
	var list_id = getCurrentListId();
	var list_tables = document.getElementsByClassName("listTable");
	var found = false;
	fastdom.mutate(function () {
		for (var i = 0; i < list_tables.length; i++) {
			if (list_tables[i].getAttribute("list_id") === list_id) {
				list_tables[i].style.display = "";
				found = true;
			}
			else {
				list_tables[i].style.display = "none";
			}
		}

		if (!found) {
			loadData(function (data) {
				var popup = document.getElementById("popup");
				var data_list = getList(data.lists, list_id);
				var new_table = buildListTable(data_list);
				popup.appendChild(new_table);
			});
		}
	});
}

function hideAllLists(callback) {
	var list_tables = document.getElementsByClassName("listTable");
	fastdom.mutate(function () {
		for (var i = 0; i < list_tables.length; i++) {
			list_tables[i].style.display = "none";
		}
		if (callback) callback();
	});
}

function unloadList(list_id, callback) {
	var list_table = getListTableById(list_id);
	fastdom.mutate(function () {
		list_table.parentElement.removeChild(list_table);
		if (callback) callback();
	});
}

function unloadAllLists(callback) {
	var list_tables = document.getElementsByClassName("listTable");
	fastdom.mutate(function () {
		var i = list_tables.length - 1;
		while (i>=0) {
			list_tables[i].parentElement.removeChild(list_tables[i]);
			i--;
		}
		if (callback) callback();
	});
}

/**
 * updates the user input volume and chapter on popup, locally and pushes change to MU
 * @param {Element} series_row
 * @param {string} vol_input
 * @param {string} chap_input
 * @param {function} callback
 */
function handleUserMUReadUpdate(series_row, vol_input, chap_input, callback) {
	var read_volume = series_row.querySelectorAll(".readVolume")[0];
	var read_volume_desc = series_row.querySelectorAll(".readVolumeDescription")[0];
	var read_chapter = series_row.querySelectorAll(".readChapter")[0];
	var read_chapter_desc = series_row.querySelectorAll(".readChapterDescription")[0];
	var not_applic = series_row.querySelectorAll(".readChapVolNA")[0];
	var volume = vol_input.value;
	var chapter = chap_input.value;
	if (volume === read_volume.textContent && chapter === read_chapter.textContent) {
		//no change
	} else {
		var series_id = getSeriesRowsId(series_row);
		userManualUpdateVolumeChapter(series_id, volume, chapter);
	}
	
	read_volume.textContent = volume;
	read_chapter.textContent = chapter;
	vol_input.parentElement.removeChild(vol_input);
	chap_input.parentElement.removeChild(chap_input);
	if (volume === "") {
		read_volume_desc.style.display = "none";
		read_volume.style.display = "none";
	} else {
		read_volume.style.display = "";
	}
	if (chapter === "") {
		read_chapter_desc.style.display = "none";
		read_chapter.style.display = "none";
	} else {
		read_chapter.style.display = "";
	}
	if (volume === "" && chapter === "") {
		not_applic.style.display = "";
	}
}

/**
 * checks to see if user is done editing volume/chapter input. if so,
 * it triggers a check to see if it needs updated
 * @param {Event} event
 */
function handleCompleteReadReleaseEdit(event) {
	var root = getReleaseFieldsReleaseDisplay(event.target);
	var vol_input = root.children[1];
	var chap_input = root.children[4];

	// tiny delay to let user switch between volume/chapter input without losing context
	setTimeout(function () {
		var field_focused = false;
		if (document.activeElement === vol_input || document.activeElement === chap_input) {
			field_focused = true;
		}

		if (!field_focused) {
			var series_row = getReleaseFieldsSeriesRow(root);
			handleUserMUReadUpdate(series_row, vol_input, chap_input);
		}
	}, 1);
}

/**
 * makes inputs for volume and chapter visible to user upon
 * clicking the text showing their current values
 * @param {Event} event
 */
function handleEnableReadReleaseEdit(event) {
	var clicked = event.target;
	var vol_focus = false;
	
	if (clicked.className === "readVolume"){		
		vol_focus = true;
	}

	var root = getReleaseFieldsReleaseDisplay(clicked);
	var volume_desc = root.children[0];
	var volume = root.children[1];
	var chapter_desc = root.children[2];
	var chapter = root.children[3];
	var not_applic = root.children[4];
	
	volume_desc.style.display = "";
	volume.style.display = "none";
	chapter_desc.style.display = "";
	chapter.style.display = "none";
	not_applic.style.display = "none";
	
	var vol_input = document.createElement('input');
	var chap_input = document.createElement('input');
	vol_input.type = "text";
	vol_input.className = "readVolumeInput";
	vol_input.maxLength = 100;
	
	chap_input.type = "text";
	chap_input.className = "readChapterInput";
	chap_input.maxLength = 100;
	
	vol_input.onblur = handleCompleteReadReleaseEdit;
	chap_input.onblur = handleCompleteReadReleaseEdit;
	
	root.insertBefore(vol_input, volume);
	root.insertBefore(chap_input, chapter);
	
	if (vol_focus) {
		vol_input.focus();
	} else chap_input.focus();
	
	vol_input.value = volume.innerHTML;
	chap_input.value = chapter.innerHTML;
}

/**
 * Opens the link associated with the series title clicked by user
 * @param {Event} event
 */
function handleTitleLink(event) {
	if (event.target.hasAttribute("user_link")) {
		var user_link = event.target.getAttribute("user_link");
		if (!isEmpty(user_link)) {
			chrome.tabs.create({ active: true, url: user_link }, function () {
				if (chrome.runtime.lastError) {
					console.error("Failed to load user url: " + chrome.runtime.lastError.message);
				}
			});
		}
	} else if (event.target.hasAttribute("default_link")) {
		var default_link = event.target.getAttribute("default_link");
		chrome.tabs.create({ active: true, url: default_link }, function () {
			if (chrome.runtime.lastError) {
				console.error("Failed to load default url: " + chrome.runtime.lastError.message);
			}
		});
	}
}

/**
 * attempts to make slightly invalid urls valid
 * @param {string} url
 * @returns {string}
 */
function validateUrl(url) {
	var has_www = (url.toLowerCase().includes("www."));
	var has_http = (url.toLowerCase().includes("http://"));
	var has_https = (url.toLowerCase().includes("https://"));
	if (!has_www) {
		return "http://www." + url;
	} else if (!has_http && !has_https) {
		return "http://" + url;
	} else return url;
}

function handleCompleteEditLink(event) {
	var input_link = event.target;
	var link = input_link.value;
	var link_is_empty = (link === "");
	var series_row = getInputLinksSeriesRow(input_link);
	var series_id = getSeriesRowsId(series_row);
	var title_link = getSeriesRowsTitleLink(series_row);

	if (link_is_empty && !title_link.hasAttribute("user_link")) {
		//do nothing
	} else {
		var link_button = getSeriesRowsEditLinkButton(series_row);
		var link_icon = getEditLinkButtonsLinkIcon(link_button);

		if (link_is_empty) {
			var default_link = getDefaultLink(series_id);
			userClearSeriesLink(series_id);
			title_link.removeAttribute("user_link");
			title_link.setAttribute("default_link", default_link);
			link_button.style.removeProperty("opacity");
			link_icon.style.removeProperty("opacity");
		} else {
			link = validateUrl(link);
			userSetSeriesLink(series_id, link);
			title_link.setAttribute("user_link", link);
			link_button.style.opacity = .97;
			link_icon.style.opacity = 1;
		}
	}
	input_link.parentElement.removeChild(input_link);
}

/**
 * creates the textbox to enter custom series link
 * @param {Event} event
 */
function handleEnableEditLink(event) {
	var edit_link_input = document.createElement('input');
	edit_link_input.type = "text";
	edit_link_input.className = "editLinkInput";
	edit_link_input.placeholder = "Paste link here";
	edit_link_input.maxLength = 1000;
	edit_link_input.onblur = handleCompleteEditLink;
	var title_block;
	if (event.target.className === "editLinkIcon") {
		title_block = getEditLinkIconsTitleBlock(event.target);
	} else if (event.target.className === "editLinkButton") {
		title_block = getEditLinkButtonsTitleBlock(event.target);
	} else return;
	var title_link = getTitleBlocksTitleLink(title_block);
	if (title_link.hasAttribute("user_link")) {
		edit_link_input.value = title_link.getAttribute("user_link");
	}
	title_block.appendChild(edit_link_input);
	edit_link_input.focus();
}

/**
 * shows/hides series rows based on input characters in list filter
 * @param {Event} event
 */
function handleListFilter(event) {
	var input = event.target;
	var filter = input.value.toUpperCase();
	filterList(filter);
}

/**
 * shows/hides series rows based on presence of string in series title
 * @param {string} filter
 */
function filterList(filter) {
	var current_list = getCurrentListId();
	var titles = document.querySelectorAll(".seriesRow[list_id=" + current_list + "] .titleLink");
	interruptAllAnimations();
	for (var i = 0; i < titles.length; i++) {
		var series_row = getTitleLinksSeriesRow(titles[i]);
		if (titles[i].innerHTML.toUpperCase().includes(filter)) {
			series_row.style.display = "";
		} else {
			series_row.style.display = "none";
		}
	}
}

/**
 *  DEV TOOLS HANDLERS
 *
 *	handlers for the dev tool buttons activating
 *  convenience functions for debugging
 */

function handleClickedClearAllData() {
	clearAllData();
}

function handleClickedPullAllData() {
	pullAllData();
}

function handleClickedUpdateLists() {
	updateLists();
}

function handleClickedRebuildPopup() {
	rebuildPopup();
}

/**
 * rebuilds the popup from scratch
 */
function rebuildPopup() {
	loadData(function (data) {
		clearPopup();
		buildPopup(data);
	});
}

/**
 * removes all (sub-body) DOM elements from popup
 */
function clearPopup() {
	while (document.body.firstChild) {
		document.body.removeChild(document.body.firstChild);
	}
}

/**
 * builds the navbar, listtable etc composing the default popup view
 * @param {Data} data
 */
function buildPopup(data) {
	data.lists.sort(cmpListAlphabetical);
	
	var popup = document.createElement("div");
	popup.id = "popup";
	document.body.appendChild(popup);
	var nav_bar = buildNavBar(data.lists);
	popup.appendChild(nav_bar);
	var list = getListById(data.lists, "read");
	var list_table = buildListTable(list);
	popup.appendChild(list_table);

	var current_list_select = document.getElementById("currentListSelect");
	current_list_select.selectedIndex = getIndexOfListInLists(data.lists, "read");
}

/**
 * Redirects the user if they are not logged in to MU
 */
function redirectToLogin() {
	var redirect_page = buildRedirectPage();
	document.body.append(redirect_page);

	console.log("Attempted redirect.");
}

/**
 * if chrome.storage fails to load data or user info this will either
 * prompt the user or to address them or if there is a current session
 * it will do nothing so as not to interfere with user
 * @param {string} current_user_id
 * @param {string} logged_in_user_id
 */
function handleSessionErrors(current_user_id, logged_in_user_id) {
	var no_session = !exists(current_user_id);
	var no_login = !exists(logged_in_user_id);

	if (no_session) {
		if (no_login) {
			redirectToLogin();
		} else console.error("Error: Session load failed");
	} else {
		if (current_user_id !== "No User") {
			redirectToLogin();
		} // else do nothing
	}
}

/**
 * determines if the session (current user, login and data) is valid and
 * consistent with previous session. If not, it will either create a new
 * session, prompt the user to login, or do nothing (if it is valid)
 * @param {Data} data
 */
function validateSession(data) {
	pullUserSessionInfo(function (current_user_id, logged_in_user_id) {
		if (!exists(current_user_id) || !exists(logged_in_user_id)) {
			handleSessionErrors();
		}

		if (logged_in_user_id === "No User") {
			if (current_user_id === "No User") {
				redirectToLogin();
			} else if (current_user_id !== "No User") {
				//do nothing
			}
		} else {
			if (current_user_id === "No User") {
				initializeNewSession(logged_in_user_id, rebuildPopup);
			} else if (current_user_id !== logged_in_user_id) {
				initializeNewSession(logged_in_user_id, rebuildPopup);
			} else if (data === "No Data") {
				initializeNewSession(current_user_id, rebuildPopup);
			}//else session is valid
		}
	});
}

/**
 * engages global listeners on startup
 */
function hookListeners() {
	document.addEventListener("click", function (event) {
		// saves lacked clicked element
		// currently used for shift-click select functionality
		global_last_clicked_el = event.target;
	});
}

/**
 * applies and refreshes effects of global preferences
 */
function popupApplyPrefs() {
	if (global_pref_scrollbar.enabled) {
		document.body.classList.remove("noScroll");
	} else {
		document.body.className = "noScroll";
	}

	if (global_pref_animations.enabled) {
		//shouldn't be necessary but just in case
		global_block_transitions = false;
	}
}

function popupSendBgPrefUpdate() {
	var message = {
		src: "en_popup",
		title: "UPDATED_PREFERENCE"
	};

	chrome.runtime.sendMessage(message, function (response) {
		console.log(response.title);
	});
}

function popupUpdatePrefs() {
	popupApplyPrefs();
	popupSendBgPrefUpdate();
}

/**
 * loads user preferences relevant to popup into global
 * @param {function} callback
 */
function popupLoadPrefs(callback) {
	loadAllPrefs(function (prefs) {
		global_pref_scrollbar = prefs["scrollbar"];
		global_pref_animations = prefs["animations"];
		global_pref_one_click_uptodate = prefs["one_click_uptodate"];
		global_pref_release_update = prefs["release_update"];
		global_pref_list_sync = prefs["list_sync"];
		global_pref_notifications = prefs["notifications"];

		popupApplyPrefs();
		callback();
	});
}

/**
 * initialization that runs on popup startup
 * defers session validation to async while popup loads
 * to give general case user quicker startup
 */
function popupInit() {
	popupLoadPrefs(function () {
		loadData(function (data) {

			if (data === "No Data") {
				console.log("No data to display.");

			} else {
				buildPopup(data);
			}
			hookListeners();
			validateSession(data);
		});
	});
	
	return;
}

// startup data load, popup building and session validation once DOM loads
document.addEventListener('DOMContentLoaded', popupInit);
