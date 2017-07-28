describe('removeSeriesFromListsById(data_lists, series_id)', () => {
    it('should remove the series', () => {
        var list1 = readListExampleBasic1();
        var list2 = wishListExampleBasic1();
        var series = list1.series_list[1];
        var series_id = series.series_id;
        removeSeriesFromListsById([list1, list2], series_id);
        var has_series = list1.series_list.includes(series);
        (has_series).should.be.false;
    });
});

describe('removeSeriesArrayFromListById(data_lists, list_id, series_id_arr)', () => {
    it('should remove all the series in the array from the list', () => {
        var list1 = wishListExampleBasic1();
        var list2 = readListExampleBasic1();
        var list_id = list1.list_id;
        var series_id_arr = [];
        list1.series_list.forEach(series => {
            series_id_arr.push(series.series_id);
        });
        removeSeriesArrayFromListById([list1, list2], list_id, series_id_arr);
        (list1.series_list.length).should.equal(0);
    });
});

describe('getNumLists(data_lists)', () => {
    it('should get the list count', () => {
        var list1 = readListExampleBasic1();
        var list2 = wishListExampleBasic1();
        getNumLists([list1, list2]).should.equal(2);
    });
});

describe('releaseCouldBeNewer(release1, release2)', () => {
    var release1;
    var release2;

    beforeEach(() => {
        release1 = releaseExampleBasic1();
        release2 = releaseExampleBasic2();
    })

    it('should return true when first releases date is newer', () => {
        release1.date = "2017-07-27T04:00:00.000Z";
        release2.date = "2017-07-26T04:00:00.000Z";
        releaseCouldBeNewer(release1, release2).should.be.true;
    });
    it('should also return true if their release dates are identical', () => {
        release1.date = "2017-07-23T04:00:00.000Z";
        release2.date = "2017-07-23T04:00:00.000Z";
        releaseCouldBeNewer(release1, release2).should.be.true;
    });
    it('should return false otherwise', () => {
        release1.date = "2017-07-01T04:00:00.000Z";
        release2.date = "2017-07-28T04:00:00.000Z";
        releaseCouldBeNewer(release1, release2).should.be.false;
    })
});

describe('releaseIsNew(data_series, release)', () => {
    var series;
    var release1;
    var release2;
    var release3;
    var release4;
    var release5;
    var release5_dup;

    beforeEach(() => {
        series = seriesExampleBasic1();
        release1 = releaseExampleBasic1();
        release2 = releaseExampleBasic2();
        release3 = releaseExampleBasic3();
        release4 = releaseExampleBasic4();
        release5 = releaseExampleBasic5();
        release5_dup = releaseExampleBasic5();
        series.latest_read_release = {};
        series.unread_releases = [];
    })
    describe('No existing releases:', () => {
        it('series should be new if series has no releases', () => {
            releaseIsNew(series, release1).should.be.true;
            releaseIsNew(series, release2).should.be.true;
            releaseIsNew(series, release3).should.be.true;
        });
        it('including if the series doesnt have release properties', () => {
            delete series.latest_read_release;
            delete series.unread_releases;
            delete series.latest_unread_release;

            releaseIsNew(series, release3).should.be.true;
            releaseIsNew(series, release4).should.be.true;
            releaseIsNew(series, release5).should.be.true;
        });
    });
    describe('With latest read release:', () => {
        beforeEach(() => {
            release5.date = "2017-07-23T04:00:00.000Z";
            release5_dup.date = "2017-07-23T04:00:00.000Z";
            series.latest_read_release = release5;
        });

        it('series should be new if newer than latest read release', () => {
            release1.date = "2018-08-24T04:00:00.000Z";
            release2.date = "2017-07-24T04:00:00.000Z";
            releaseIsNew(series, release1).should.be.true;
            releaseIsNew(series, release2).should.be.true;
        });

        it('or if their dates are identical', () => {
            release1.date = "2017-07-23T04:00:00.000Z";
            releaseIsNew(series, release1).should.be.true;
        });

        it('except when all their other properties are identical too.', () => {
            releaseIsNew(series, release5_dup).should.be.false;
        });

        it('and if its older, it isn\'t new', () => {
            release3.date = "2013-07-24T04:00:00.000Z";
            release4.date = "2017-07-20T04:00:00.000Z";
            releaseIsNew(series, release3).should.be.false;
            releaseIsNew(series, release4).should.be.false;
        });
    });

    describe('With latest unread release:', () => {
        beforeEach(() => {
            release5.date = "2017-07-23T04:00:00.000Z";
            release5_dup.date = "2017-07-23T04:00:00.000Z";
            series.latest_unread_release = release5;
        });

        it('series should be new if newer than latest unread release', () => {
            release1.date = "2018-08-24T04:00:00.000Z";
            release2.date = "2017-07-24T04:00:00.000Z";
            releaseIsNew(series, release1).should.be.true;
            releaseIsNew(series, release2).should.be.true;
        });

        it('or if their dates are identical', () => {
            release1.date = "2017-07-23T04:00:00.000Z";
            releaseIsNew(series, release1).should.be.true;
        });

        it('except when all their other properties are identical too.', () => {
            releaseIsNew(series, release5_dup).should.be.false;
        });

        it('and if its older, it isn\'t new', () => {
            release3.date = "2013-07-24T04:00:00.000Z";
            release4.date = "2017-07-20T04:00:00.000Z";
            releaseIsNew(series, release3).should.be.false;
            releaseIsNew(series, release4).should.be.false;
        });
    });

    describe('With unread releases:', () => {
        beforeEach(() => {
            release5_dup.date = "2017-08-10T04:00:00.000Z";
            release5.date = "2017-08-10T04:00:00.000Z"; // newest
            release3.date = "2017-07-25T04:00:00.000Z"; // 2nd newest
            release2.date = "2017-07-20T04:00:00.000Z"; // latest read
            series.latest_unread_release = release5;
            series.unread_releases = [release5, release3];
            series.latest_read_release = release2;
        });
        it('series should be new if newer than all releases', () => {
            release1.date = "2018-01-01T04:00:00.000Z";
            releaseIsNew(series, release1).should.be.true;
        });
        it('it shouldn\'t be new if it\'s in between', () => {
            release1.date = "2017-08-05T04:00:00.000Z";
            release4.date = "2017-07-23T04:00:00.000Z";
            releaseIsNew(series, release1).should.be.false;
            releaseIsNew(series, release4).should.be.false;
        });
        it('or if it\'s the oldest', () => {
            release1.date = "2001-01-01T04:00:00.000Z";
            releaseIsNew(series, release1).should.be.false;
        });
        it('or if it\'s completely identical to the newest', () => {
            releaseIsNew(series, release5_dup).should.be.false;
        });
        it('but if only the date is the same as the newest, it\'s new', () => {
            release1.date = "2017-08-10T04:00:00.000Z";
            releaseIsNew(series, release1).should.be.true;
        });
    });
});