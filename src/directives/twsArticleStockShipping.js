angular.module('twsArticleStockShipping').directive('twsArticleStockShipping',
['twsApi.Jed', 'twsApi.Locale', '$q', 'twsArticleService.ArticleService',
  function(jed, locale, $q, ArticleService) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        'articleUid': '=articleUid'
      },
      templateUrl: 'tws-article-stock-shipping/templates/twsArticleStockShipping.html',
      link: function(scope, element, attrs) { //jshint ignore:line
        jed(scope, 'tws-article-stock-shipping');
        scope.lang = locale.language();

        scope.$watch('articleUid', function(value) {
          if (!value) { return; }

          ArticleService.update(scope.articleUid).then(function(articleData) {
            scope.article     = articleData.article;
            scope.articleData = articleData;
            scope.schemaForm  = articleData.schemaForm;
          });
        });
      }
    };
  }
]);
