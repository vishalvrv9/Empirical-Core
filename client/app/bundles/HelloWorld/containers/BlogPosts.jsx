import React from 'react';
import CreateOrEditBlogPost from '../components/cms/blog_posts/create_or_edit_blog_post.jsx';
import BlogPostIndex from '../components/blog_posts/blog_post_index.jsx';
import BlogPost from '../components/blog_posts/blog_post.jsx';
import SortableList from '../components/shared/sortableList'
import request from 'request';
import moment from 'moment';

export default class BlogPosts extends React.Component {
  constructor(props) {
    super(props)

    const topicObj = {}
    this.props.topics.map(t => {
      topicObj[t] = this.props.blogPosts.filter(bp => bp.topic === t)
    })
    this.state = topicObj
    this.renderBlogPostsByTopic = this.renderBlogPostsByTopic.bind(this)
  }

  updateOrder(sortInfo, t) {
    const originalOrder = this.state[t];
    debugger;
    const newOrder = sortInfo.data.items.map(item => item.key);
    const newOrderedBlogPosts = newOrder.map((key, i) => {
      const newBlogPost = originalOrder[key];
      newBlogPost.order_number = i;
      return newBlogPost;
    });
    this.setState({[t]: newOrderedBlogPosts});
  }

  confirmDelete(e) {
    if(window.prompt('To delete this post, please type DELETE.') !== 'DELETE') {
      e.preventDefault();
    }
  }

  renderTableHeader() {
    return <thead>
      <tr>
        <td></td>
        <td>Title</td>
        <td>Topic</td>
        <td>Created</td>
        <td>Updated</td>
        <td>Rating</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    </thead>
  }

  renderTableRow(blogPost, index) {
    return <tr>
      <td>{blogPost.draft ? 'DRAFT' : ''}</td>
      <td>{blogPost.title}</td>
      <td>{blogPost.topic}</td>
      <td>{moment(blogPost.created_at).format('MM-DD-YY')}</td>
      <td>{moment(blogPost.updated_at).format('MM-DD-YY')}</td>
      <td>{blogPost.rating}</td>
      <td><a className="button" href={`/cms/blog_posts/${blogPost.id}/edit`}>Edit</a></td>
      <td><a className="button" href={`/cms/blog_posts/${blogPost.id}/delete`}>Delete</a></td>
    </tr>
  }

  renderBlogPostsByTopic() {
    const tables = Object.keys(this.state).map(t => {
      const filteredBlogPostRows = this.state[t].map((bp, i) => this.renderTableRow(bp, i))
      if (filteredBlogPostRows.length > 0) {
        return <div>
          <h1>{t}</h1>
          <div className="sortable-table">
            {this.renderTableHeader()}
            <SortableList data={filteredBlogPostRows} sortCallback={(sortInfo) => this.updateOrder(sortInfo, t)} />
          </div>
        </div>
      }
    }
    )
    return tables
  }

  render() {
    if (['new', 'edit'].includes(this.props.action)) {
      return <CreateOrEditBlogPost {...this.props} />;
    } else if (this.props.route === 'show') {
      return <BlogPost {...this.props} />;
    } else if (this.props.route === 'index') {
      return <BlogPostIndex {...this.props} />;
    }
    return (
      <div className="cms-blog-posts">
        <a href="/cms/blog_posts/new" className="btn button-green">New Blog Post</a>
        <br /><br />
        {this.renderBlogPostsByTopic()}
      </div>
    );
  }

};
