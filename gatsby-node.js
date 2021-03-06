/**
import { graphql } from 'gatsby';
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require("path");
const slash = require("slash");
const { paginate } = require("gatsby-awesome-pagination");

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  const pageTemplate = path.resolve("./src/templates/page.js");
  const archiveTemplate = path.resolve("./src/templates/archive.js");
  const postTemplate = path.resolve("./src/templates/post.js");

  const result = await graphql(`
    {
      allWordpressPage {
        edges {
          node {
            id
            status
            path
            wordpress_id
            wordpress_parent
          }
        }
      }
      allWordpressPost {
        edges {
          node {
            id
            link
            status
            categories {
              id
            }
          }
        }
      }
      allWordpressCategory {
        edges {
          node {
            id
            name
            slug
            count
          }
        }
      }
    }
  `);

  // Check for errors
  if (result.errors) {
    throw new Error(result.errors);
  }

  const {
    allWordpressPage,
    allWordpressPost,
    allWordpressCategory,
  } = result.data;

/**
 * ------------------------------------------
 * Create Archive Pages for Categories
 * ------------------------------------------
 */
  allWordpressCategory.edges.forEach(catEdge => {
    // First filter out the posts that belongs to the current category
    const filteredPosts = allWordpressPost.edges.filter(
      // destructure out the categories
      ({ node: { categories } }) =>
        categories.some(el => el.id === catEdge.node.id)
    );
    // Some categories may be empty and we don't want to show them
    if (filteredPosts.length > 0) {
      paginate({
        createPage,
        items: filteredPosts,
        itemsPerPage: 10,
        pathPrefix: `/trends/${catEdge.node.slug}`,
        component: slash(archiveTemplate),
        context: {
          catId: catEdge.node.id,
          catName: catEdge.node.name,
          catSlug: catEdge.node.slug,
          catCount: catEdge.node.count,
          categories: allWordpressCategory.edges,
        },
      });
    }
  });

  /**
   * ------------------------------------------
   * Create Wordpress Pages
   * ------------------------------------------
   */
  allWordpressPage.edges.forEach(edge => {
    if (edge.node.status === "publish") {
      createPage({
        path: edge.node.path,
        component: slash(pageTemplate),
        // send data to pageTemplate via context
        context: {
          id: edge.node.id,
          parent: edge.node.wordpress_parent,
          wpId: edge.node.wordpress_id,
        },
      });
    }
  });

  /**
   * ------------------------------------------
   * Create Wordpress Posts
   * ------------------------------------------
   */
  allWordpressPost.edges.forEach(edge => {
    if(edge.node.status === 'publish') {
      createPage({
        // no forward slash after `/trends` since link returned from WP already has it
        // i.e --> "/en-historisk-julkaramell/",
        path: `/trends${edge.node.link}/`,
        component: slash(postTemplate),
        context: {
          id: edge.node.id,
        }
      })
    }
  })
};
