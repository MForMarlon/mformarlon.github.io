$('document').ready(function(){
    twitter.init();
    facebook.init();
});
   
var twitter = {
    init: function(){
        twitter.tweets = [];
        twitter.loaded = false;
        $.ajax({
            url: 'http://api.twitter.com/1/statuses/user_timeline.json?screen_name=RGA',
            dataType: 'jsonp',
            success: function(data){
                twitter.tweets = twitter.parseTweets(data);
            },
            error: function(){
                alert('Uh oh, something bad happened when trying to access the Twitter account!');
            },
            complete: function(){
                twitter.loaded = true;
                twitter.renderTweets();
            }
        });
    },
    parseTweets: function(tweets){
        // This "linkifies" any @mentions, #hashtags, or links from the text property in each tweet object using regex magic.
        for(var i = 0; i < tweets.length; i++){
            tweets[i].tweetHtml = tweets[i].text.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function(url) {
              return '<a target="_blank" href="' + url + '">' + url + '</a>';
            }).replace(/\B@([_a-z0-9]+)/ig, function(reply) {
              return '<a target="_blank" href="http://twitter.com/' + reply.substring(1) + '">' + reply + '</a>';
            }).replace(/\B#([_a-z0-9]+)/ig, function(hashTag) {
              return '<a target="_blank" href="http://twitter.com/search?q=%23' + hashTag.substring(1) + '">' + hashTag + '</a>';
            });
            var times = twitter.getTimes(tweets[i].created_at);
            tweets[i].prettyDate = times.prettyDate;
        }
        return tweets;
    },
    getTimes: function(createdAt){
        // Given a date, this returns a human-readable time as a string.
        var times = {};
        var values = createdAt.split(" ");
        createdAt = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
        var parsed_date = Date.parse(createdAt);
        var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
        var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
        delta = delta + (relative_to.getTimezoneOffset() * 60);
        times.secondsAgo = delta;

        if (delta < 60) {
            times.prettyDate = 'less than a minute ago';
        } else if(delta < 120) {
            times.prettyDate = 'about a minute ago';
        } else if(delta < (60 * 60)) {
            times.prettyDate = (parseInt(delta / 60)).toString() + ' minutes ago';
        } else if(delta < (120 * 60)) {
            times.prettyDate = 'about an hour ago';
        } else if(delta < (24 * 60 * 60)) {
            times.prettyDate = 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
        } else if(delta < (48 * 60 * 60)) {
            times.prettyDate = '1 day ago';
        } else {
            times.prettyDate = (parseInt(delta / 86400)).toString() + ' days ago';
        }
        return times;
    },
    renderTweets: function(){
        // Puts the tweets on the page and sets up the cycle.
        var html = '';
        $.each(twitter.tweets, function(i, tweet){
            var profileImage = '<a target="_blank" href="http://twitter.com/' + tweet.user.screen_name + '"><img alt="RGA" src="' + tweet.user.profile_image_url + '" /></a>';
            var timeAgo = '<div class="tweet-time-ago">' + tweet.prettyDate + '</div>';
            var message = tweet.tweetHtml;
            var date = '<div class="tweet-date">' + tweet.prettyDate + '</div>';
            var actions = '<div class="tweet-actions"><a target="_blank" href="http://twitter.com/intent/tweet?in_reply_to=' + tweet.id_str + '">Reply</a> | <a target="_blank" href="http://twitter.com/intent/retweet?tweet_id=' + tweet.id_str + '">Retweet</a> | <a target="_blank" href="http://twitter.com/intent/favorite?tweet_id=' + tweet.id_str + '">Favorite</a></div>';
            html += '<div class="row tweet"><div class="span1">' + profileImage + '</div><div class="span5">' + message + date + actions + '</div></div>';
        });
        $('#rga-tweets').append(html);
        $('.tweet').hide();
        var index = -1;
        setInterval(function(){
            index++;
            if(index >= twitter.tweets.length){
                index = 0;
            }
            $('.tweet').hide();
            $('.tweet:eq(' + index + ')').fadeIn();
        }, 5000);
    }
}; // end twitter object

var facebook = {
    init: function(url){
        facebook.loaded = false;
        facebook.posts = [];

        $.ajax({
            url: 'https://graph.facebook.com/rga/posts?access_token=214211591956849%7C748901331b5fe2da53b5dafb.1-519550385%7C3_Yi8cb1OsNv0usl007Qa_f69_4',
            dataType: 'jsonp',
            success: function(data){
                facebook.posts = facebook.parsePosts(data.data);
            },
            error: function(){
                alert('Something bad happened when attempting to access facebook.');
            },
            complete: function() {
                facebook.loaded = true;
                facebook.renderPosts();
            },
        });
    },
    
    parsePosts: function(posts){
        var validPosts = [];
        for(var i = 0; i < posts.length; i++){
            if(posts[i].message){
                var post = {};
                post.from = posts[i].from;
                post.postLink = 'http://www.facebook.com/RGA/posts/'+(posts[i].id.split('_').length > 1 ? posts[i].id.split('_')[1] : posts[i].id);
                post.postHtml = posts[i].message.replace(/((https?|s?ftp|ssh)\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function(url) {
                  return '<a target="_blank" href="' + url + '">' + url + '</a>';
                }).replace(/\n/g, ' ');
                post.picture = posts[i].picture;
                var date = new Date(posts[i].created_time);
                if(date){
                    var times = twitter.getTimes(date.toString('ddd MMM d HH:MM:ss +0000 yyyy'));
                    post.prettyDate = times.prettyDate;
                    validPosts.push(post);
                }
            }
        }
        return validPosts;
    },
    
    renderPosts: function(){
        var html = '';
        $.each(facebook.posts, function(i, post){
            var postPic = '<a target="_blank" href="' + post.postLink + '"><img alt="RGA" src="' + post.picture + '" /></a>';
            var timeAgo = '<div class="post-time-ago">' + post.prettyDate + '</div>';
            var message = post.postHtml;
            var actions = '<div class="tweet-actions"><a target="_blank" href="' + post.postLink + '">Like</a> | <a target="_blank" href="' + post.postLink + '">Comment</a> | <a target="_blank" href="' + post.postLink + '">Share</a></div>';
            html += '<div class="row post"><div class="span2">' + postPic + '</div><div class="span4">' + message + timeAgo + actions + '</div></div>';
        });
        $('#rga-posts').append(html);
        $('.post').hide();
        var index = -1;
        setInterval(function(){
            index++;
            if(index >= facebook.posts.length){
                index = 0;
            }
            $('.post').hide();
            $('.post:eq(' + index + ')').fadeIn();
        }, 5000);
    }
};
