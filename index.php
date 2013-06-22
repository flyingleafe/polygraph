<?php

$f3=require('lib/base.php');

$f3->config('config.ini');

$f3->route('GET /',
	function($f3) {
		$f3->set('content', 'index.page');
		echo View::instance()->render('master.html');
	}
);

$f3->route('GET /@page',
    function($f3) {
        $page = $f3->get('PARAMS.page');
        if( file_exists($f3->get('UI').$page.'.page.html') ) {
            $f3->set('content', $page.'.page');
        } else {
            $f3->set('content', '404');
            header("HTTP/1.0 404 Not Found");
        }
        echo View::instance()->render('master.html');
    }
);

$f3->route('GET /userref',
	function() {
		echo View::instance()->render('userref.htm');
	}
);

$f3->run();
