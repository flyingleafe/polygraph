/** Application module **/
angular.module('serviceOrder', ['ngCookies'])
    .directive('bsPopover', function() {
        return function(scope, el, attrs) {
            scope.$watch(attrs.dataContent, function(val) {
                $(el).popover({ container: 'body' });
            });
        };
    });

/** Controllers **/
function ConnectionsCtrl($scope, $http) {
    $http.get('connections.json').success(function(data) {
        $scope.connections = data;
    });
}

function ServicesCtrl($scope, $http, $cookieStore, $timeout) {
    $http.get('services.json').success(function(data) {
        $scope.services = data;
        if(window.location.hash.match(/^#\/service\/[0-9]+$/)) {
            var h = window.location.hash,
                sid = parseInt(h.substr(h.lastIndexOf('/')+1));
            $scope.chooseSrv(sid);
        }
    });

    $scope.newChosenService = 0; // default first

    $scope.chosenServices = $cookieStore.get('chSrv') || [];

    $scope.$watch('chosenServices', function() {    // watching for the order changes
        console.log('watch!');
        $cookieStore.put('chSrv', $scope.chosenServices);    // to save the data between refreshes
    }, true);

    $scope.chooseSrv = function (sid) {
            srv = {
                "id": sid,
                "params": [],
                "active": false
            },
            orig = _.findWhere($scope.services, {"id": sid});
        srv.name = orig.name;

        _.each(orig.params, function (p, i, list) {
            srv.params[i] = {};
            switch(p.type) {
                case "number":
                    srv.params[i].value = 2;
                    break;
                case "string":
                    srv.params[i].value = '';
                    break;
                case "select":
                case "radio":
                    srv.params[i].value = p.values[0].val;
                    break;
                case "multiselect":
                    srv.params[i].value = '';
                    break;
                case "checkbox":
                    srv.params[i].value = false;
                    break;
            }
        });
        $scope.chosenServices.push(srv);
        $scope.activateEdit(srv.id, $scope.chosenServices.length-1, true);
    };

    $scope.activateEdit = function(sid, num, globNum) {
        var g = globNum || false,
            i = 0,
            edits = _.where($scope.chosenServices, {"id": sid});
        _.each(edits, function (p) { p.active = false; });
        if(g) i = num;
        else {
            var j = 0;
            for(var k in $scope.chosenServices) {
                if($scope.chosenServices[k] == edits[j]) {
                    if(j == num) {
                        i = k;
                        break;
                    }
                    j++;
                }
            }
        }
        $scope.chosenServices[i].active = true;
    };

    $scope.findActiveEditNum = function (sid) {
        var i = 0;
        while($scope.chosenServices[i].id != sid || $scope.chosenServices[i].active == false) ++i;
        return i;
    };

    $scope.srvChange = function () {
        console.log($scope.chosenServices);
    };

    $scope.removeSrv = function (i) {
        $scope.chosenServices.splice(i, 1);
    };

    $scope.uniqueChosenServices = function() {
        var ids = [];
        return _.filter($scope.chosenServices, function (srv) {
            var notHas = ids.indexOf(srv.id) == -1;
            if(notHas) ids.push(srv.id);
            return notHas;
        });
    };

    $scope.getEdits = function(sid) {
        return _.where($scope.chosenServices, {"id": sid});
    };

    $scope.getOrig = function(sid) {
        return _.findWhere($scope.services, {"id": sid});
    };

    $scope.getParam = function(sid, p) {
        return $scope.getOrig(sid).params[p];
    };

    $scope.srvName = function (name) {
        if($scope.uniqueChosenServices().length > 1) return name;
        return "Параметры заказа";
    };

    $scope.srvCost = function (snum) {
        var srv = $scope.chosenServices[snum],
            orig = _.findWhere($scope.services, {"id": srv.id}),
            cost = 1;
        for(var i in srv.params) {
            var type = orig.params[i].type,
                k = 1;
            if(type == "number")
                k = eval(orig.params[i].k.replace('$val', srv.params[i].value));
            if(type == "select")
                k = _.findWhere(orig.params[i].values, {"val": srv.params[i].value}).k;
            if(type == "multiselect")
                for(var j in srv.params[i].value)
                    k *= orig.params[i].values[srv.params[i].value[j]].k;
            cost *= k;
        }
        return parseInt(cost) || 0;
    };

    $scope.totalCost = function() {
        var c = 0;
        for(var i in $scope.chosenServices)
            c += $scope.srvCost(i);
        return c;
    };
}


$(function() {
    $('.services tr').click(function(e) {
        if(e.target.nodeName !== 'A') {
            $(this).find('.collapse').collapse('show');
        }
    });
    $('.service-more').on('show', function() {
        var id = this.id,
            a = $('a[href="#' + id + '"]');
        a.html('Свернуть <span class="caret"></span>').addClass('dropup');
    }).on('hide', function() {
        var id = this.id,
            a = $('a[href="#' + id + '"]');
        a.html('Подробнее <span class="caret"></span>').removeClass('dropup');
    });

    // $('.popovered').popover({
    //     container: 'body'
    // });

    $('body').on('hover', 'button.popovered', function (e) {
        $(this).popover({
            container: 'body'
        });
    });

    var otBadge = $('#ot-badge'),
        otAnchor = $('#ot-anchor'),
        otAnchorHeight = otAnchor.height(),
        watchBadge = function() {
            if(otAnchor.offset().top + otAnchorHeight - $(window).scrollTop() <= $(window).height()) {
                otBadge.hide();
            } else {
                otBadge.show();
            }
        };
    if(otBadge.length) {
        $(window).scroll(watchBadge).resize(watchBadge);
        watchBadge();
    }

    $('body').on('click', '.disabled', function() { return false; });
});